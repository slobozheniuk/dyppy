import { PrismaClient } from '../generated/prisma/client.js';
import { DataPaths, getLastLocalUpdateDate, listTournamentYearFiles, readTournamentYear, writeTournamentYear, readJsonFile, writeJsonFile, readRawFile, writeRawFile, rawTournamentDetailPath, rawPlayerPath, readUnregisteredPlayers, writeUnregisteredPlayers } from '../transform/local-store.js';
import { fetchAvailableYears, fetchIntermediaryIds, fetchActualIds, parseTournamentDetails, Tournament } from '../fetch/tournaments.js';
import { parsePlayerJson, Player } from '../fetch/players.js';
import { buildRegisteredNameLookup, patchTournamentCompetitors, collectPlayerData, UnregisteredPlayer, splitName } from '../transform/reconcile.js';
import { createSeedContext, seedTournament } from '../upload/db-inserter.js';
import { recalculateAllElos } from '../upload/elo-recalculator.js';
import pLimit from 'p-limit';
import path from 'path';
import fs from 'fs';
import { fetchPlayerJSON, fetchTournamentHTML } from '../fetch.js';

export interface UpdateOptions {
  prisma: PrismaClient;
  dataPaths: DataPaths;
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

// Step 1.2 — download tournaments from cutoffDate onward
export async function downloadTournamentsFromDate(opts: { dataPaths: DataPaths; cutoffDate: Date | null; force?: boolean; log?: boolean }): Promise<{ yearsProcessed: string[]; tournamentsDownloaded: number }> {
  let fetched = 0;
  const years = await fetchAvailableYears();
  const cutoffYear = opts.cutoffDate ? opts.cutoffDate.getFullYear().toString() : '2000';
  const yearsToProcess = years.filter(y => parseInt(y) >= parseInt(cutoffYear));

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

  return { yearsProcessed: yearsToProcess, tournamentsDownloaded: fetched };
}

// Step 1.3 — refresh player files for players appearing in matches since fromDate
export async function downloadPlayersForDateRange(opts: { dataPaths: DataPaths; fromDate: Date | null; force?: boolean; log?: boolean }): Promise<{ playersDownloaded: number }> {
  let playersDownloaded = 0;
  // Collect players to check
  const allRegisteredNames = new Map<number, string>();
  const allUnregistered = new Map<string, UnregisteredPlayer>();
  const yearsFiles = listTournamentYearFiles(opts.dataPaths);

  for (const year of yearsFiles) {
    const tList = readTournamentYear(opts.dataPaths, year) ?? [];
    for (const t of tList) {
      if (!opts.force && opts.fromDate && new Date(t.date) < opts.fromDate) continue; // Skip ones strictly before if not forcing
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
export async function uploadAndRecalculate(opts: { dataPaths: DataPaths; prisma: PrismaClient; fromDate?: Date | null; force?: boolean; skipElo?: boolean; log?: boolean }): Promise<{ tournamentsUpserted: number; eloFromDate: Date | undefined }> {
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
    const tournaments = readTournamentYear(opts.dataPaths, year) ?? [];
    for (const raw of tournaments) {
      const tDate = new Date(raw.date);
      if (opts.fromDate && !opts.force && tDate < opts.fromDate) continue;

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
    if (!opts.force && changedDates.length > 0) {
      eloFromDate = changedDates.sort((a, b) => a.getTime() - b.getTime())[0];
    }
    await recalculateAllElos({ prisma: opts.prisma, fromDate: eloFromDate, log: opts.log });
  }

  return { tournamentsUpserted: upserted, eloFromDate };
}

// Main: composes steps 1.1–1.5
export async function runDataUpdate(opts: UpdateOptions): Promise<UpdateResult> {
  const cutoffDate = opts.force ? null : await getLastUpdateDate({ dataPaths: opts.dataPaths, prisma: opts.prisma, log: opts.log });

  if (opts.log) console.log(`Starting Data Update. Cutoff: ${cutoffDate ? cutoffDate.toISOString().slice(0, 10) : 'Full sync'}`);

  const { yearsProcessed, tournamentsDownloaded } = await downloadTournamentsFromDate({
    dataPaths: opts.dataPaths,
    cutoffDate,
    force: opts.force,
    log: opts.log
  });

  const { playersDownloaded } = await downloadPlayersForDateRange({
    dataPaths: opts.dataPaths,
    fromDate: cutoffDate,
    force: opts.force,
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
    force: opts.force,
    skipElo: opts.skipElo,
    log: opts.log
  });

  return {
    yearsProcessed,
    tournamentsDownloaded,
    playersDownloaded,
    referencesPatched,
    tournamentsUpserted,
    eloFromDate
  };
}
