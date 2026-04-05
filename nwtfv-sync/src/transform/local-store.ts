/**
 * local-store.ts
 *
 * Canonical read/write layer for the local data/ folder.
 * All file paths are derived from a DataPaths object — no global constants.
 *
 * data/ layout:
 *   intermediary-tournaments/YEAR.json   ← array of group IDs
 *   tournaments/YEAR.json                ← array of Tournament objects (parsed)
 *   players/NWTFVID.json                 ← player profile
 *   players/unregistered.json            ← players with no nwtfvId
 *   raw/tournaments/list-YEAR.html       ← raw HTML: year-filtered tournament list
 *   raw/tournaments/group-GROUP_ID.html  ← raw HTML: intermediary group page
 *   raw/tournaments/detail-ACTUAL_ID.html ← raw HTML: full tournament detail page
 *   raw/players/PLAYER_ID.json           ← raw JSON: player API response
 */

import fs from 'fs';
import path from 'path';
import type { Player } from '../fetch/players.js';
import type { UnregisteredPlayer } from './reconcile.js';

// ─── DataPaths ────────────────────────────────────────────────────────────────

export interface DataPaths {
  dataDir: string;
  intermediaryDir: string;
  tournamentsDir: string;
  playersDir: string;
  rawDir: string;
  rawTournamentsDir: string;
  rawPlayersDir: string;
}

export function makeDataPaths(dataDir: string): DataPaths {
  const rawDir = path.join(dataDir, 'raw');
  return {
    dataDir,
    intermediaryDir: path.join(dataDir, 'intermediary-tournaments'),
    tournamentsDir: path.join(dataDir, 'tournaments'),
    playersDir: path.join(dataDir, 'players'),
    rawDir,
    rawTournamentsDir: path.join(rawDir, 'tournaments'),
    rawPlayersDir: path.join(rawDir, 'players'),
  };
}

export function ensureDataDirs(paths: DataPaths): void {
  for (const dir of [
    paths.intermediaryDir,
    paths.tournamentsDir,
    paths.playersDir,
    paths.rawTournamentsDir,
    paths.rawPlayersDir,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ─── Raw file helpers ─────────────────────────────────────────────────────────

export function readRawFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

export function writeRawFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

export function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Domain readers / writers ─────────────────────────────────────────────────

export function readIntermediaryIds(paths: DataPaths, year: string): number[] | null {
  return readJsonFile<number[]>(path.join(paths.intermediaryDir, `${year}.json`));
}

export function writeIntermediaryIds(paths: DataPaths, year: string, ids: number[]): void {
  writeJsonFile(path.join(paths.intermediaryDir, `${year}.json`), ids);
}

/** Returns raw JSON array (dates are ISO strings, not Date objects). */
export function readTournamentYear(paths: DataPaths, year: string): any[] | null {
  return readJsonFile<any[]>(path.join(paths.tournamentsDir, `${year}.json`));
}

export function writeTournamentYear(paths: DataPaths, year: string, tournaments: any[]): void {
  writeJsonFile(path.join(paths.tournamentsDir, `${year}.json`), tournaments);
}

export function readPlayerFile(paths: DataPaths, playerId: number): any | null {
  return readJsonFile<any>(path.join(paths.playersDir, `${playerId}.json`));
}

export function writePlayerFile(paths: DataPaths, playerId: number, player: any): void {
  writeJsonFile(path.join(paths.playersDir, `${playerId}.json`), player);
}

export function readUnregisteredPlayers(paths: DataPaths): UnregisteredPlayer[] {
  return readJsonFile<UnregisteredPlayer[]>(path.join(paths.playersDir, 'unregistered.json')) ?? [];
}

export function writeUnregisteredPlayers(paths: DataPaths, players: UnregisteredPlayer[]): void {
  writeJsonFile(path.join(paths.playersDir, 'unregistered.json'), players);
}

/** Returns sorted array of year strings present in the tournaments/ folder (e.g. ['2009','2010',...]). */
export function listTournamentYearFiles(paths: DataPaths): string[] {
  if (!fs.existsSync(paths.tournamentsDir)) return [];
  return fs.readdirSync(paths.tournamentsDir)
    .filter(f => /^\d{4}\.json$/.test(f))
    .map(f => f.replace('.json', ''))
    .sort();
}

/**
 * Returns the most recent tournament date stored across all year files,
 * or null if no data exists yet.
 */
export function getLastLocalUpdateDate(paths: DataPaths): Date | null {
  const years = listTournamentYearFiles(paths);
  let maxDate: Date | null = null;

  for (const year of years) {
    const tournaments = readTournamentYear(paths, year);
    if (!tournaments) continue;
    for (const t of tournaments) {
      const d = t.date ? new Date(t.date) : null;
      if (d && !isNaN(d.getTime())) {
        if (!maxDate || d > maxDate) maxDate = d;
      }
    }
  }

  return maxDate;
}

/**
 * Returns a function that reads a player profile from the local data/ folder.
 * Provides defaults for skeleton players (only id/name/surname present).
 */
export function makeLocalPlayerReader(paths: DataPaths): (id: number) => Promise<Player | null> {
  return async (id: number): Promise<Player | null> => {
    const data = readPlayerFile(paths, id);
    if (!data) return null;
    return {
      id: data.id,
      name: data.name ?? '',
      surname: data.surname ?? '',
      avatarUrl: data.avatarUrl,
      category: data.category ?? '',
      clubs: data.clubs ?? [],
      organisations: data.organisations ?? [],
      nationalNumber: data.nationalNumber ?? '',
      internationalNumber: data.internationalNumber,
      rankings: data.rankings ?? [],
    };
  };
}

// ─── Raw path helpers (used by workflow) ─────────────────────────────────────

export function rawTournamentListPath(paths: DataPaths, year: string): string {
  return path.join(paths.rawTournamentsDir, `list-${year}.html`);
}

export function rawTournamentGroupPath(paths: DataPaths, groupId: number): string {
  return path.join(paths.rawTournamentsDir, `group-${groupId}.html`);
}

export function rawTournamentDetailPath(paths: DataPaths, actualId: number): string {
  return path.join(paths.rawTournamentsDir, `detail-${actualId}.html`);
}

export function rawPlayerPath(paths: DataPaths, playerId: number): string {
  return path.join(paths.rawPlayersDir, `${playerId}.json`);
}
