/**
 * reconcile.ts
 *
 * Pure data-transformation functions for name reconciliation and competitor
 * patching. No network I/O, no database — operates on in-memory objects and
 * the local data/ folder (read-only via playersDir path).
 */

import fs from 'fs';
import path from 'path';

export type UnregisteredPlayer = { name: string; surname: string };

type PlayerEntry = { id: number; tokens: Set<string> };

/** Splits a display name into lowercase tokens, stripping commas. */
function tokenize(s: string): string[] {
  return (s ?? '').toLowerCase().replace(/,/g, '').trim().split(/\s+/).filter(Boolean);
}

/**
 * Splits a full display name (e.g. "Müller, Hans") into name/surname parts.
 * Tournament names are in "Surname, Firstname" format.
 */
export function splitName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: '' };
  const surname = parts.slice(0, -1).join(' ').replace(/,+$/, '');
  const name = parts[parts.length - 1];
  return { name, surname };
}

/**
 * Builds a list of registered players with their name token sets by reading
 * all numeric JSON files from the given players directory.
 * Tokens come from both name and surname fields so ordering doesn't matter.
 */
export function buildRegisteredNameLookup(playersDir: string): PlayerEntry[] {
  const entries: PlayerEntry[] = [];
  if (!fs.existsSync(playersDir)) return entries;
  for (const file of fs.readdirSync(playersDir)) {
    if (!/^\d+\.json$/.test(file)) continue;
    const raw = fs.readFileSync(path.join(playersDir, file), 'utf-8');
    const data = JSON.parse(raw);
    if (!data?.id || !data.name) continue;
    const tokens = new Set([...tokenize(data.name), ...tokenize(data.surname ?? '')]);
    if (tokens.size > 0) entries.push({ id: data.id, tokens });
  }
  return entries;
}

/**
 * Checks whether a tournament display name matches a registered player.
 * All tokens from the display name must be present in the player's token set.
 * Requires at least 2 query tokens to avoid false positives on single surnames.
 */
export function findPlayerMatch(displayName: string, entries: PlayerEntry[]): number | undefined {
  const queryTokens = tokenize(displayName);
  if (queryTokens.length < 2) return undefined;
  return entries.find(e => queryTokens.every(t => e.tokens.has(t)))?.id;
}

/**
 * Walks all competitors in a tournament and fills in missing nwtfvIds wherever
 * the player's display name matches a registered player.
 * Returns the number of references patched.
 */
export function patchTournamentCompetitors(tournament: any, entries: PlayerEntry[]): number {
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

/**
 * Walks a tournament and collects:
 * - registeredNames: nwtfvId → full display name
 * - unregistered: players with no nwtfvId (deduplicated by name)
 */
export function collectPlayerData(tournament: any): {
  registeredNames: Map<number, string>;
  unregistered: UnregisteredPlayer[];
} {
  const registeredNames = new Map<number, string>();
  const unregisteredSet = new Map<string, UnregisteredPlayer>();

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
