import { PrismaClient } from '../generated/prisma/client.js';
import { DataPaths, getLastLocalUpdateDate, listTournamentYearFiles, readTournamentYear, writeTournamentYear, readJsonFile, writeJsonFile, readRawFile, writeRawFile, rawTournamentDetailPath, rawPlayerPath, readUnregisteredPlayers, writeUnregisteredPlayers } from '../transform/local-store.js';
import { fetchAvailableYears, fetchIntermediaryIds, fetchActualIds, parseTournamentDetails, Tournament } from '../fetch/tournaments.js';
import { parsePlayerJson, parsePlayerGames, Player } from '../fetch/players.js';
import { buildRegisteredNameLookup, patchTournamentCompetitors, collectPlayerData, UnregisteredPlayer, splitName } from '../transform/reconcile.js';
import { patchDrawsInTournament, buildPlayerGamesMap } from '../transform/reconcile-draws.js';
import { createSeedContext, seedTournament } from '../upload/db-inserter.js';
import { recalculateAllElos } from '../upload/elo-recalculator.js';
import pLimit from 'p-limit';
import path from 'path';
import fs from 'fs';
import { fetchPlayerJSON, fetchTournamentHTML } from '../fetch.js';

export interface UpdateOptions {
  prisma: PrismaClient;
  dataPaths: DataPaths;
  year?: string;
  force?: boolean;
  skipElo?: boolean;
  log?: boolean;
}

export interface UpdateResult {
  yearsProcessed: string[];
  tournamentsDownloaded: number;
  tournamentsUpserted: number;
  playersDownloaded: number;
  referencesPatched: number;
  gamesPatched: number;
  eloFromDate: Date | undefined;
}

// Step 1.1 — determine last update date (min of local + DB)
export async function getLastUpdateDate(opts: { dataPaths: DataPaths; prisma: PrismaClient; log?: boolean }): Promise<Date | null> {
  const localDate = getLastLocalUpdateDate(opts.dataPaths);
  const dbDateGame = await opts.prisma.game.findFirst({
    include: { tournament: { select: { date: true } } },
    orderBy: { tournament: { date: 'desc' } }
  });

  const dbDate = dbDateGame?.tournament?.date ?? null;
  if (opts.log) {
    console.log(`Local last update: ${localDate ? localDate.toISOString().slice(0, 10) : 'None'}`);
    console.log(`DB last update:    ${dbDate ? dbDate.toISOString().slice(0, 10) : 'None'}`);
  }

  if (!dbDate && !localDate) return null;
  if (!dbDate) return localDate;
  if (!localDate) return dbDate;

  // Return MIN of local and DB dates so we process anything missing in either
  return localDate < dbDate ? localDate : dbDate;
}

// Step 1.2 — download tournaments from cutoffDate onward (or for a specific targetYear)
export async function downloadTournamentsFromDate(opts: { dataPaths: DataPaths; cutoffDate: Date | null; targetYear?: string; force?: boolean; log?: boolean }): Promise<{ yearsProcessed: string[]; tournamentsDownloaded: number; newTournamentIds: number[] }> {
  let fetched = 0;
  const newTournamentIds: number[] = [];
  const years = await fetchAvailableYears();

  let yearsToProcess: string[];
  if (opts.targetYear) {
    yearsToProcess = years.filter(y => y === opts.targetYear);
    if (yearsToProcess.length === 0 && opts.log) console.warn(`[Tournaments] targetYear ${opts.targetYear} not found in available years.`);
  } else {
    const cutoffYear = opts.cutoffDate ? opts.cutoffDate.getFullYear().toString() : '2000';
    yearsToProcess = years.filter(y => parseInt(y) >= parseInt(cutoffYear));
  }

  for (const year of yearsToProcess) {
    if (opts.log) console.log(`[Tournaments] Processing year ${year}...`);
    const intermediaryIds = await fetchIntermediaryIds(year);
    const tournamentFile = path.join(opts.dataPaths.tournamentsDir, `${year}.json`);
    const existingTournaments: any[] = readTournamentYear(opts.dataPaths, year) ?? [];
    const existingIds = new Set(existingTournaments.map(t => t.id));

    const limitOuter = pLimit(4);
    const actualIdGroups = await Promise.all(
      intermediaryIds.map(gid => limitOuter(async () => ({ gid, ids: await fetchActualIds(gid) })))
    );

    const allActualIds: { actualId: number; gid: number }[] = [];
    for (const { gid, ids } of actualIdGroups) {
      for (const id of ids) allActualIds.push({ actualId: id, gid });
    }

    const toFetch = opts.force ? allActualIds : allActualIds.filter(({ actualId }) => !existingIds.has(actualId));

    if (toFetch.length > 0) {
      const limitInner = pLimit(4);
      const newTournaments: any[] = [];
      const tasks = toFetch.map(({ actualId, gid }) => limitInner(async () => {
        try {
          const rawFile = rawTournamentDetailPath(opts.dataPaths, actualId);
          let html = !opts.force ? readRawFile(rawFile) : null;
          if (!html) {
            html = await fetchTournamentHTML(actualId);
            writeRawFile(rawFile, html);
          }
          const details = parseTournamentDetails(html);
          if (opts.cutoffDate && new Date(details.date) < opts.cutoffDate && !opts.force) return;
          newTournaments.push({ id: actualId, tournamentGroupID: gid, ...details });
          newTournamentIds.push(actualId);
          fetched++;
          if (opts.log) console.log(`Downloaded tournament: ${details.name}`);
        } catch (err) {
          if (opts.log) console.error(`Error downloading tournament ${actualId}`, err);
        }
      }));
      await Promise.all(tasks);

      const merged = [...existingTournaments, ...newTournaments];
      merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      writeTournamentYear(opts.dataPaths, year, merged);
    }
  }

  return { yearsProcessed: yearsToProcess, tournamentsDownloaded: fetched, newTournamentIds };
}

// Step 1.3b — cross-match player game history to correct draw results
export async function patchNewTournamentDraws(opts: { dataPaths: DataPaths; newTournamentIds: number[]; log?: boolean }): Promise<{ gamesPatched: number }> {
  if (opts.newTournamentIds.length === 0) return { gamesPatched: 0 };

  // Collect all registered player IDs from the new tournaments across all year files
  const allPlayerIds = new Set<number>();
  const newIdSet = new Set(opts.newTournamentIds);

  for (const year of listTournamentYearFiles(opts.dataPaths)) {
    const tList = readTournamentYear(opts.dataPaths, year) ?? [];
    for (const t of tList) {
      if (!newIdSet.has(t.id)) continue;
      const { registeredNames } = collectPlayerData(t);
      for (const id of registeredNames.keys()) allPlayerIds.add(id);
    }
  }

  if (allPlayerIds.size === 0) return { gamesPatched: 0 };
  if (opts.log) console.log(`[DrawPatch] Cross-matching draws for ${allPlayerIds.size} players in ${opts.newTournamentIds.length} new tournaments...`);

  // Read saved raw player JSONs (written in step 1.3) and parse game histories
  const rawJsons: any[] = [];
  for (const playerId of allPlayerIds) {
    const rawFile = rawPlayerPath(opts.dataPaths, playerId);
    const rawText = readRawFile(rawFile);
    if (rawText) {
      try { rawJsons.push(JSON.parse(rawText)); } catch { /* ignore */ }
    }
  }

  const playerGamesMap = buildPlayerGamesMap(rawJsons);

  // Patch each new tournament and write back if changed
  let totalPatched = 0;
  for (const year of listTournamentYearFiles(opts.dataPaths)) {
    const tList = readTournamentYear(opts.dataPaths, year) ?? [];
    let fileChanged = false;
    for (const t of tList) {
      if (!newIdSet.has(t.id)) continue;
      const patched = patchDrawsInTournament(t, playerGamesMap);
      if (patched > 0) { totalPatched += patched; fileChanged = true; }
    }
    if (fileChanged) writeTournamentYear(opts.dataPaths, year, tList);
  }

  if (opts.log && totalPatched > 0) console.log(`[DrawPatch] Patched ${totalPatched} draw(s) across ${opts.newTournamentIds.length} tournament(s).`);
  return { gamesPatched: totalPatched };
}

export async function downloadPlayersForDateRange(opts: { dataPaths: DataPaths; fromDate: Date | null; targetYear?: string; force?: boolean; log?: boolean }): Promise<{ playersDownloaded: number }> {
  let playersDownloaded = 0;
  // Collect players to check
  const allRegisteredNames = new Map<number, string>();
  const allUnregistered = new Map<string, UnregisteredPlayer>();
  const yearsFiles = listTournamentYearFiles(opts.dataPaths);

  for (const year of yearsFiles) {
    if (opts.targetYear && year.replace('.json', '') !== opts.targetYear) continue;
    const tList = readTournamentYear(opts.dataPaths, year) ?? [];
    for (const t of tList) {
      if (!opts.force && !opts.targetYear && opts.fromDate && new Date(t.date) < opts.fromDate) continue; // Skip ones strictly before if not forcing and no target year
      const { registeredNames, unregistered } = collectPlayerData(t);
      for (const [id, name] of registeredNames) allRegisteredNames.set(id, name);
      for (const u of unregistered) allUnregistered.set(u.name + ' ' + u.surname, u);
    }
  }

  const idsToFetch = opts.force
    ? [...allRegisteredNames.keys()]
    : [...allRegisteredNames.keys()].filter(id => !fs.existsSync(path.join(opts.dataPaths.playersDir, `${id}.json`)));

  if (idsToFetch.length > 0) {
    const limitPlayers = pLimit(4);
    const tasks = idsToFetch.map(playerId => limitPlayers(async () => {
      const rawFile = rawPlayerPath(opts.dataPaths, playerId);
      try {
        let rawText = !opts.force ? readRawFile(rawFile) : null;
        if (!rawText) {
          const res = await fetchPlayerJSON(playerId);
          rawText = JSON.stringify(res);
          writeRawFile(rawFile, rawText);
        }
        const json = JSON.parse(rawText);
        const player = parsePlayerJson(json);
        writeJsonFile(path.join(opts.dataPaths.playersDir, `${playerId}.json`), player);
        playersDownloaded++;
      } catch (err) {
        const fullName = allRegisteredNames.get(playerId) ?? String(playerId);
        const { name, surname } = splitName(fullName);
        writeJsonFile(path.join(opts.dataPaths.playersDir, `${playerId}.json`), { id: playerId, name, surname });
      }
    }));
    await Promise.all(tasks);
  }

  // Unregistered players update
  const currentUnregistered = readUnregisteredPlayers(opts.dataPaths);
  const existingKeys = new Set(currentUnregistered.map(p => p.name + ' ' + p.surname));
  const newUnregistered = [...allUnregistered.values()].filter(p => !existingKeys.has(p.name + ' ' + p.surname));
  if (newUnregistered.length > 0 || opts.force) {
    const merged = opts.force ? [...allUnregistered.values()] : [...currentUnregistered, ...newUnregistered];
    writeUnregisteredPlayers(opts.dataPaths, merged);
  }

  return { playersDownloaded };
}

// Step 1.4 — apply name reconciliation and write updated JSONs
export async function reconcileLocalData(opts: { dataPaths: DataPaths; years?: string[]; log?: boolean }): Promise<{ referencesPatched: number }> {
  const playerEntries = buildRegisteredNameLookup(opts.dataPaths.playersDir);
  const yearsFiles = opts.years || listTournamentYearFiles(opts.dataPaths);
  let totalPatched = 0;

  for (const year of yearsFiles) {
    const tournaments = readTournamentYear(opts.dataPaths, year) ?? [];
    let filePatched = 0;
    for (const t of tournaments) filePatched += patchTournamentCompetitors(t, playerEntries);
    if (filePatched > 0) {
      writeTournamentYear(opts.dataPaths, year, tournaments);
      totalPatched += filePatched;
    }
  }
  return { referencesPatched: totalPatched };
}

function countGamesInTournament(t: any): number {
  const countRound = (r: any) =>
    (r?.divisions || []).flatMap((d: any) => d.gameStages).reduce((s: number, gs: any) => s + gs.games.length, 0);
  return countRound(t.mainRound) + (t.qualifyingRound ? countRound(t.qualifyingRound) : 0);
}

// Step 1.5 — upsert to DB + ELO recalculation from earliest changed date
export async function uploadAndRecalculate(opts: { dataPaths: DataPaths; prisma: PrismaClient; fromDate?: Date | null; targetYear?: string; force?: boolean; skipElo?: boolean; log?: boolean }): Promise<{ tournamentsUpserted: number; eloFromDate: Date | undefined }> {
  const yearFiles = listTournamentYearFiles(opts.dataPaths);
  const changedDates: Date[] = [];
  let upserted = 0;

  // Custom context for reading players locally
  const ctx = createSeedContext({
    prisma: opts.prisma,
    getPlayerDetails: async (id: number) => {
      const data = readJsonFile<any>(path.join(opts.dataPaths.playersDir, `${id}.json`));
      return data ? data as Player : null;
    },
    log: opts.log,
  });

  for (const year of yearFiles) {
    const yearStr = year.replace('.json', '');
    if (opts.targetYear && yearStr !== opts.targetYear) continue;

    const tournaments = readTournamentYear(opts.dataPaths, year) ?? [];
    for (const raw of tournaments) {
      const tDate = new Date(raw.date);
      if (opts.fromDate && !opts.force && !opts.targetYear && tDate < opts.fromDate) continue;

      const t = { ...raw, date: tDate } as Tournament;

      if (!opts.force) {
        const existing = await opts.prisma.tournament.findUnique({ where: { nwtfvId: t.id } });
        if (existing) {
          const localCount = countGamesInTournament(t);
          const dbCount = await opts.prisma.game.count({ where: { tournamentId: existing.id } });
          if (localCount !== dbCount) {
            await opts.prisma.tournament.delete({ where: { id: existing.id } });
            await seedTournament(ctx, t, {});
            changedDates.push(t.date);
            upserted++;
          }
          continue;
        }
      }
      await seedTournament(ctx, t, { force: opts.force });
      changedDates.push(t.date);
      upserted++;
    }
  }

  let eloFromDate: Date | undefined = undefined;
  if (!opts.skipElo) {
    if ((!opts.force || opts.targetYear) && changedDates.length > 0) {
      eloFromDate = changedDates.sort((a, b) => a.getTime() - b.getTime())[0];
    }
    await recalculateAllElos({ prisma: opts.prisma, fromDate: eloFromDate, log: opts.log });
  }

  return { tournamentsUpserted: upserted, eloFromDate };
}

// Main: composes steps 1.1–1.5
export async function runDataUpdate(opts: UpdateOptions): Promise<UpdateResult> {
  const cutoffDate = (opts.force || opts.year) ? null : await getLastUpdateDate({ dataPaths: opts.dataPaths, prisma: opts.prisma, log: opts.log });

  if (opts.log) {
    if (opts.year) console.log(`Starting Data Update for year ${opts.year}.`);
    else console.log(`Starting Data Update. Cutoff: ${cutoffDate ? cutoffDate.toISOString().slice(0, 10) : 'Full sync'}`);
  }

  const { yearsProcessed, tournamentsDownloaded, newTournamentIds } = await downloadTournamentsFromDate({
    dataPaths: opts.dataPaths,
    cutoffDate,
    targetYear: opts.year,
    force: opts.force,
    log: opts.log
  });

  const { playersDownloaded } = await downloadPlayersForDateRange({
    dataPaths: opts.dataPaths,
    fromDate: cutoffDate,
    targetYear: opts.year,
    force: opts.force,
    log: opts.log
  });

  // Step 1.3b: cross-match player game history to correct draws (uses raw player files from step 1.3)
  const { gamesPatched } = await patchNewTournamentDraws({
    dataPaths: opts.dataPaths,
    newTournamentIds,
    log: opts.log
  });

  const { referencesPatched } = await reconcileLocalData({
    dataPaths: opts.dataPaths,
    log: opts.log
  });

  const { tournamentsUpserted, eloFromDate } = await uploadAndRecalculate({
    dataPaths: opts.dataPaths,
    prisma: opts.prisma,
    fromDate: cutoffDate,
    targetYear: opts.year,
    force: opts.force,
    skipElo: opts.skipElo,
    log: opts.log
  });

  return {
    yearsProcessed,
    tournamentsDownloaded,
    playersDownloaded,
    referencesPatched,
    gamesPatched,
    tournamentsUpserted,
    eloFromDate
  };
}
