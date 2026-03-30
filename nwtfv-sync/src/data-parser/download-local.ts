/**
 * download-local.ts
 *
 * Downloads raw tournament and player data from nwtfv.com into the local
 * data/ folder without touching the database. Useful for offline analysis
 * and as a staging step before seeding Supabase.
 *
 * Layout:
 *   data/intermediary-tournaments/YEAR.json        ← array of group IDs (parsed)
 *   data/tournaments/YEAR.json                     ← array of Tournament objects (parsed)
 *   data/players/NWTFVID.json                      ← player profile (parsed)
 *   data/players/unregistered.json                 ← players with no nwtfvId
 *   data/raw/tournaments/list-YEAR.html            ← raw HTML: year-filtered tournament list
 *   data/raw/tournaments/group-GROUP_ID.html       ← raw HTML: intermediary group page
 *   data/raw/tournaments/detail-ACTUAL_ID.html     ← raw HTML: full tournament detail page
 *   data/raw/players/PLAYER_ID.json                ← raw JSON: player API response
 *
 * Usage:
 *   npx tsx src/data-parser/download-local.ts                  # all years, oldest first
 *   npx tsx src/data-parser/download-local.ts --year=2024      # specific year(s)
 *   npx tsx src/data-parser/download-local.ts --year=2023,2024
 *   npx tsx src/data-parser/download-local.ts --force          # re-download everything
 */

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { parseTournamentDetails, Tournament } from './tournaments.js';
import { parsePlayerJson } from './players.js';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const yearArg = args.find(a => a.startsWith('--year='))?.split('=')[1];
const force = args.includes('--force');

const yearFilter: string[] | undefined = yearArg ? yearArg.split(',').map(y => y.trim()) : undefined;

// ─── Paths ────────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve('data');
const INTERMEDIARY_DIR = path.join(DATA_DIR, 'intermediary-tournaments');
const TOURNAMENTS_DIR = path.join(DATA_DIR, 'tournaments');
const PLAYERS_DIR = path.join(DATA_DIR, 'players');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const RAW_TOURNAMENTS_DIR = path.join(RAW_DIR, 'tournaments');
const RAW_PLAYERS_DIR = path.join(RAW_DIR, 'players');

function ensureDirs() {
  for (const dir of [INTERMEDIARY_DIR, TOURNAMENTS_DIR, PLAYERS_DIR, RAW_TOURNAMENTS_DIR, RAW_PLAYERS_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readRaw(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function writeRaw(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── nwtfv.com fetchers ───────────────────────────────────────────────────────

const TOURNAMENTS_URL = 'https://nwtfv.com/turniere?format=json';

async function fetchAvailableYears(): Promise<string[]> {
  const res = await fetch(TOURNAMENTS_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const years: string[] = [];
  $('select[name="filter_saison_id"] option').each((_, el) => {
    const text = $(el).text().trim();
    if (/^\d{4}$/.test(text)) {
      years.push(text);
    }
  });

  // Oldest first
  years.sort((a, b) => parseInt(a) - parseInt(b));
  return years;
}

async function fetchIntermediaryIds(year: string): Promise<number[]> {
  const rawFile = path.join(RAW_TOURNAMENTS_DIR, `list-${year}.html`);
  let filteredHtml = !force ? readRaw(rawFile) : null;

  if (filteredHtml) {
    console.log(`    (using cached raw HTML)`);
  } else {
    const res = await fetch(TOURNAMENTS_URL);
    const baseHtml = await res.text();
    const $ = cheerio.load(baseHtml);

    const saisonOption = $('select[name="filter_saison_id"] option')
      .filter((_, el) => $(el).text().trim() === year)
      .first();

    if (!saisonOption.length) {
      console.warn(`  ⚠ Year ${year} not found in saison list, skipping.`);
      return [];
    }

    const saisonId = saisonOption.val() as string;
    const formData = new URLSearchParams();
    formData.append('filter_saison_id', saisonId);
    formData.append('task', 'turniere');

    const filteredRes = await fetch(TOURNAMENTS_URL, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    filteredHtml = await filteredRes.text();
    writeRaw(rawFile, filteredHtml);
  }

  const $f = cheerio.load(filteredHtml);
  const ids: number[] = [];
  $f('tr.sectiontableentry1, tr.sectiontableentry2').each((_, row) => {
    const aTags = $f(row).find('a');
    if (aTags.length < 2) return;
    const href = $f(aTags[1]).attr('href') ?? '';
    const match = href.match(/turnierid=(\d+)/);
    if (match) ids.push(parseInt(match[1], 10));
  });

  return Array.from(new Set(ids));
}

async function fetchActualIds(intermediaryId: number): Promise<number[]> {
  const rawFile = path.join(RAW_TOURNAMENTS_DIR, `group-${intermediaryId}.html`);
  let html = !force ? readRaw(rawFile) : null;

  if (!html) {
    const url = `https://nwtfv.com/turniere?task=turnierdisziplinen&turnierid=${intermediaryId}&format=json`;
    const res = await fetch(url);
    html = await res.text();
    writeRaw(rawFile, html);
  }

  const $ = cheerio.load(html);
  const ids: number[] = [];
  $('a').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const match = href.match(/turnierdisziplin&id=(\d+)/);
    if (match) ids.push(parseInt(match[1], 10));
  });

  return Array.from(new Set(ids));
}

// ─── Player data collection ───────────────────────────────────────────────────

export type UnregisteredPlayer = { name: string; surname: string };

/** Splits a display name into lowercase tokens, stripping commas. */
function tokenize(s: string): string[] {
  return (s ?? '').toLowerCase().replace(/,/g, '').trim().split(/\s+/).filter(Boolean);
}

type PlayerEntry = { id: number; tokens: Set<string> };

/**
 * Builds a list of registered players with their name token sets.
 * Tokens come from both name and surname fields so ordering doesn't matter.
 */
function buildRegisteredNameLookup(): PlayerEntry[] {
  const entries: PlayerEntry[] = [];
  if (!fs.existsSync(PLAYERS_DIR)) return entries;
  for (const file of fs.readdirSync(PLAYERS_DIR)) {
    if (!/^\d+\.json$/.test(file)) continue;
    const data = readJson<any>(path.join(PLAYERS_DIR, file));
    if (!data?.id || !data.name) continue;
    const tokens = new Set([...tokenize(data.name), ...tokenize(data.surname ?? '')]);
    if (tokens.size > 0) entries.push({ id: data.id, tokens });
  }
  return entries;
}

/**
 * Checks whether a tournament display name matches a registered player.
 * All tokens from the display name must be present in the player's token set — extra
 * tokens on the registered side (e.g. middle names) are allowed.
 * Requires at least 2 query tokens to avoid false positives on single surnames.
 */
function findPlayerMatch(displayName: string, entries: PlayerEntry[]): number | undefined {
  const queryTokens = tokenize(displayName);
  if (queryTokens.length < 2) return undefined;
  return entries.find(e => queryTokens.every(t => e.tokens.has(t)))?.id;
}

/**
 * Walks all competitors in a tournament and fills in missing nwtfvIds wherever
 * the player's display name matches a registered player.
 * Returns the number of references patched.
 */
function patchTournamentCompetitors(tournament: any, entries: PlayerEntry[]): number {
  let count = 0;

  function patchPlayer(p: any) {
    if (!p || p.nwtfvId) return;
    const match = findPlayerMatch(p.name, entries);
    if (match !== undefined) { p.nwtfvId = match; count++; }
  }

  function patchCompetitor(c: any) {
    if (!c) return;
    if (c.type === 'player') patchPlayer(c.player);
    else if (c.type === 'team') { patchPlayer(c.player1); patchPlayer(c.player2); }
  }

  function patchRound(round: any) {
    if (!round) return;
    for (const p of round.finalPlacements ?? []) patchCompetitor(p.competitor);
    for (const div of round.divisions ?? []) {
      for (const stage of div.gameStages ?? []) {
        for (const game of stage.games ?? []) {
          patchCompetitor(game.competitor1);
          patchCompetitor(game.competitor2);
        }
      }
    }
  }

  patchRound(tournament.mainRound);
  patchRound(tournament.qualifyingRound);
  return count;
}

function splitName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: '' };
  // Tournament names are "Surname, Firstname" — strip trailing comma from surname
  const surname = parts.slice(0, -1).join(' ').replace(/,+$/, '');
  const name = parts[parts.length - 1];
  return { name, surname };
}

/**
 * Walks a tournament and collects:
 * - registeredNames: nwtfvId → full display name (for skeleton fallback on fetch failure)
 * - unregistered: players with no nwtfvId (stored in unregistered.json)
 */
function collectPlayerData(tournament: any): {
  registeredNames: Map<number, string>;
  unregistered: UnregisteredPlayer[];
} {
  const registeredNames = new Map<number, string>();
  const unregisteredSet = new Map<string, UnregisteredPlayer>(); // keyed by name to dedupe

  function walkCompetitor(c: any) {
    if (!c) return;
    if (c.type === 'player') {
      const p = c.player;
      if (p?.nwtfvId) registeredNames.set(p.nwtfvId, p.name);
      else if (p?.name) { const s = splitName(p.name); unregisteredSet.set(p.name, s); }
    }
    if (c.type === 'team') {
      for (const p of [c.player1, c.player2]) {
        if (!p) continue;
        if (p.nwtfvId) registeredNames.set(p.nwtfvId, p.name);
        else if (p.name) { const s = splitName(p.name); unregisteredSet.set(p.name, s); }
      }
    }
  }

  function walkRound(round: any) {
    if (!round) return;
    for (const p of round.finalPlacements ?? []) walkCompetitor(p.competitor);
    for (const div of round.divisions ?? []) {
      for (const stage of div.gameStages ?? []) {
        for (const game of stage.games ?? []) {
          walkCompetitor(game.competitor1);
          walkCompetitor(game.competitor2);
        }
      }
    }
  }

  walkRound(tournament.mainRound);
  walkRound(tournament.qualifyingRound);
  return { registeredNames, unregistered: [...unregisteredSet.values()] };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📥 Download Local Data');
  console.log(`   Years:  ${yearFilter ? yearFilter.join(', ') : 'all (oldest first)'}`);
  console.log(`   Force:  ${force}\n`);

  ensureDirs();

  // 1. Resolve which years to process
  let years: string[];
  if (yearFilter && yearFilter.length > 0) {
    years = yearFilter;
    console.log(`📅 Using year filter: ${years.join(', ')}\n`);
  } else {
    console.log('📅 Fetching available years from nwtfv.com...');
    years = await fetchAvailableYears();
    console.log(`   Found years: ${years.join(', ')}\n`);
  }

  const allRegisteredNames = new Map<number, string>(); // nwtfvId → display name
  const allUnregistered = new Map<string, UnregisteredPlayer>(); // name → entry (global dedupe)

  // 2. Process each year
  for (const year of years) {
    console.log(`── Year ${year} ──────────────────────────────────────────`);

    // 2a. Intermediary IDs
    const intermediaryFile = path.join(INTERMEDIARY_DIR, `${year}.json`);
    let intermediaryIds: number[];

    if (!force && fs.existsSync(intermediaryFile)) {
      intermediaryIds = readJson<number[]>(intermediaryFile) ?? [];
      console.log(`  ⏩ Intermediary IDs already downloaded (${intermediaryIds.length} groups)`);
    } else {
      console.log(`  📡 Fetching intermediary tournament IDs for ${year}...`);
      intermediaryIds = await fetchIntermediaryIds(year);
      writeJson(intermediaryFile, intermediaryIds);
      console.log(`  ✅ Saved ${intermediaryIds.length} group IDs → ${path.relative(process.cwd(), intermediaryFile)}`);
    }

    if (intermediaryIds.length === 0) {
      console.log(`  ⚠ No tournaments found for ${year}, skipping.\n`);
      continue;
    }

    // 2b. Actual tournaments — load existing array, only fetch missing IDs
    const tournamentFile = path.join(TOURNAMENTS_DIR, `${year}.json`);
    const existingTournaments: any[] = readJson<any[]>(tournamentFile) ?? [];
    const existingIds = new Set(existingTournaments.map((t: any) => t.id));

    // Expand all intermediary IDs to actual tournament IDs
    console.log(`  📡 Resolving actual tournament IDs from ${intermediaryIds.length} groups...`);
    const limitOuter = pLimit(4);
    const actualIdGroups = await Promise.all(
      intermediaryIds.map(gid =>
        limitOuter(async () => {
          try {
            const ids = await fetchActualIds(gid);
            return { gid, ids };
          } catch (err) {
            console.error(`    ❌ Failed to resolve group ${gid}:`, err instanceof Error ? err.message : err);
            return { gid, ids: [] as number[] };
          }
        })
      )
    );

    const allActualIds: { actualId: number; gid: number }[] = [];
    for (const { gid, ids } of actualIdGroups) {
      for (const id of ids) {
        allActualIds.push({ actualId: id, gid });
      }
    }

    const toFetch = force
      ? allActualIds
      : allActualIds.filter(({ actualId }) => !existingIds.has(actualId));

    console.log(`  📊 ${allActualIds.length} total tournaments, ${existingIds.size} already downloaded, ${toFetch.length} to fetch`);

    if (toFetch.length > 0) {
      const limitInner = pLimit(4);
      const newTournaments: any[] = [];
      let fetched = 0;

      const tasks = toFetch.map(({ actualId, gid }) =>
        limitInner(async () => {
          const rawFile = path.join(RAW_TOURNAMENTS_DIR, `detail-${actualId}.html`);
          try {
            let html = !force ? readRaw(rawFile) : null;
            if (!html) {
              const url = `https://nwtfv.com/turniere?task=turnierdisziplin&id=${actualId}&format=json`;
              const res = await fetch(url);
              html = await res.text();
              writeRaw(rawFile, html);
            }
            const details = parseTournamentDetails(html);
            const tournament: Tournament = { id: actualId, tournamentGroupID: gid, ...details };
            newTournaments.push(tournament);
            fetched++;
            console.log(`  [${fetched}/${toFetch.length}] ✅ ${tournament.name} ${tournament.type} — ${tournament.place} (${tournament.date})`);
          } catch (err) {
            console.error(`  [?/${toFetch.length}] ❌ Tournament ${actualId}:`, err instanceof Error ? err.message : err);
          }
        })
      );

      await Promise.all(tasks);

      // Merge and save — sort chronologically within the year file
      const merged = [...existingTournaments, ...newTournaments];
      merged.sort((a, b) => {
        const parse = (d: string) => {
          const [dd, mm, yyyy] = d.split('.');
          return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd)).getTime();
        };
        return parse(a.date) - parse(b.date);
      });

      writeJson(tournamentFile, merged);
      console.log(`  ✅ Saved ${merged.length} tournaments → ${path.relative(process.cwd(), tournamentFile)}`);
    } else {
      console.log(`  ⏩ All tournaments already downloaded`);
    }

    // 2c. Collect player data from this year's tournaments
    const yearTournaments: any[] = readJson<any[]>(tournamentFile) ?? [];
    for (const t of yearTournaments) {
      const { registeredNames, unregistered } = collectPlayerData(t);
      for (const [id, name] of registeredNames) allRegisteredNames.set(id, name);
      for (const u of unregistered) allUnregistered.set(u.name + ' ' + u.surname, u);
    }

    console.log('');
  }

  // 3. Fetch registered players
  console.log(`── Players ───────────────────────────────────────────────`);
  console.log(`  Found ${allRegisteredNames.size} unique registered player IDs across all processed years`);

  const idsToFetch = force
    ? [...allRegisteredNames.keys()]
    : [...allRegisteredNames.keys()].filter(id => !fs.existsSync(path.join(PLAYERS_DIR, `${id}.json`)));

  console.log(`  ${allRegisteredNames.size - idsToFetch.length} already downloaded, ${idsToFetch.length} to fetch\n`);

  if (idsToFetch.length > 0) {
    const limitPlayers = pLimit(4);
    let fetched = 0;
    let skeletons = 0;

    const tasks = idsToFetch.map(playerId =>
      limitPlayers(async () => {
        const rawFile = path.join(RAW_PLAYERS_DIR, `${playerId}.json`);
        try {
          let rawText = !force ? readRaw(rawFile) : null;
          if (!rawText) {
            const url = `https://nwtfv.com/spieler?task=spieler_details&id=${playerId}&format=json`;
            const res = await fetch(url);
            rawText = await res.text();
            writeRaw(rawFile, rawText);
          }
          const json = JSON.parse(rawText);
          const player = parsePlayerJson(json);
          writeJson(path.join(PLAYERS_DIR, `${playerId}.json`), player);
          fetched++;
          if ((fetched + skeletons) % 20 === 0 || (fetched + skeletons) === idsToFetch.length) {
            console.log(`  Players: ${fetched + skeletons}/${idsToFetch.length} processed (${skeletons} skeletons)`);
          }
        } catch (err) {
          // Profile endpoint unreachable — save a skeleton from tournament name data
          const fullName = allRegisteredNames.get(playerId) ?? String(playerId);
          const { name, surname } = splitName(fullName);
          writeJson(path.join(PLAYERS_DIR, `${playerId}.json`), { id: playerId, name, surname });
          skeletons++;
          console.log(`  ⚠ Player ${playerId} unreachable, saved skeleton: ${name} ${surname}`);
        }
      })
    );

    await Promise.all(tasks);
    console.log(`\n  ✅ Players done — ${fetched} full profiles, ${skeletons} skeletons`);
  } else {
    console.log('  ⏩ All players already downloaded');
  }

  // 4. Save unregistered players
  const unregisteredFile = path.join(PLAYERS_DIR, 'unregistered.json');
  const existingUnregistered: UnregisteredPlayer[] = readJson<UnregisteredPlayer[]>(unregisteredFile) ?? [];
  const existingUnregisteredKeys = new Set(existingUnregistered.map(p => p.name + ' ' + p.surname));
  const newUnregistered = [...allUnregistered.values()].filter(p => !existingUnregisteredKeys.has(p.name + ' ' + p.surname));
  if (newUnregistered.length > 0 || force) {
    const merged = force ? [...allUnregistered.values()] : [...existingUnregistered, ...newUnregistered];
    merged.sort((a, b) => (a.surname + a.name).localeCompare(b.surname + b.name));
    writeJson(unregisteredFile, merged);
    console.log(`\n  ✅ Unregistered players: ${merged.length} total (${newUnregistered.length} new) → ${path.relative(process.cwd(), unregisteredFile)}`);
  } else {
    console.log(`\n  ⏩ Unregistered players already up to date (${existingUnregistered.length} entries)`);
  }

  // 5. Reconcile unregistered players with registered IDs across ALL year files
  console.log(`\n── Reconciling unregistered players ─────────────────────`);
  const playerEntries = buildRegisteredNameLookup();
  console.log(`  Name lookup built from ${playerEntries.length} player files`);

  const allYearFiles = fs.existsSync(TOURNAMENTS_DIR)
    ? fs.readdirSync(TOURNAMENTS_DIR).filter(f => /^\d{4}\.json$/.test(f)).sort()
    : [];

  let totalPatched = 0;
  for (const file of allYearFiles) {
    const filePath = path.join(TOURNAMENTS_DIR, file);
    const tournaments: any[] = readJson<any[]>(filePath) ?? [];
    let filePatched = 0;
    for (const t of tournaments) filePatched += patchTournamentCompetitors(t, playerEntries);
    if (filePatched > 0) {
      writeJson(filePath, tournaments);
      console.log(`  ✅ ${file}: patched ${filePatched} player references`);
      totalPatched += filePatched;
    }
  }
  if (totalPatched === 0) {
    console.log(`  ⏩ No unregistered players could be matched`);
  } else {
    console.log(`  Total patched: ${totalPatched} references across ${allYearFiles.length} year files`);
  }

  // Remove matched players from unregistered.json
  const unregisteredFilePath = path.join(PLAYERS_DIR, 'unregistered.json');
  const currentUnregistered: UnregisteredPlayer[] = readJson<UnregisteredPlayer[]>(unregisteredFilePath) ?? [];
  const stillUnregistered = currentUnregistered.filter(p =>
    findPlayerMatch(`${p.name} ${p.surname}`, playerEntries) === undefined &&
    findPlayerMatch(`${p.surname} ${p.name}`, playerEntries) === undefined
  );
  if (stillUnregistered.length < currentUnregistered.length) {
    writeJson(unregisteredFilePath, stillUnregistered);
    console.log(`  ✅ Removed ${currentUnregistered.length - stillUnregistered.length} matched entries from unregistered.json (${stillUnregistered.length} remain)`);
  }

  // 6. Summary
  const tournamentCount = years.reduce((sum, year) => {
    const file = path.join(TOURNAMENTS_DIR, `${year}.json`);
    const arr = readJson<any[]>(file) ?? [];
    return sum + arr.length;
  }, 0);
  const playerCount = fs.readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json') && f !== 'unregistered.json').length;
  const unregisteredCount = (readJson<UnregisteredPlayer[]>(path.join(PLAYERS_DIR, 'unregistered.json')) ?? []).length;
  const rawTournamentCount = fs.existsSync(RAW_TOURNAMENTS_DIR) ? fs.readdirSync(RAW_TOURNAMENTS_DIR).length : 0;
  const rawPlayerCount = fs.existsSync(RAW_PLAYERS_DIR) ? fs.readdirSync(RAW_PLAYERS_DIR).length : 0;

  console.log(`\n─── Summary ───`);
  console.log(`  Years processed:     ${years.length}`);
  console.log(`  Tournaments stored:  ${tournamentCount} parsed, ${rawTournamentCount} raw files`);
  console.log(`  Players stored:      ${playerCount} registered + ${unregisteredCount} unregistered, ${rawPlayerCount} raw files`);
  console.log(`  Data directory:      ${path.relative(process.cwd(), DATA_DIR)}/`);
  console.log(`  Done! 🎉\n`);
}

main().catch(err => {
  console.error('❌ Download failed:', err);
  process.exit(1);
});
