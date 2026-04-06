/**
 * reconcile-draws.ts
 *
 * Cross-matches games parsed from tournament HTML against the player details
 * API game history, and corrects any games that were recorded as wins/losses
 * but should actually be draws (ergebnis = 0).
 *
 * Background: The NWTFV tournament page has no concept of a draw — it always
 * shows one player as the Winner and one as the Loser. However, the player
 * details API (last 10 games) exposes the real result via the `ergebnis` field.
 *
 * A draw is represented in local tournament data as:
 *   scores: [{ score1: 0, score2: 0 }]
 *
 * This is a sentinel value. The ELO system treats these games as no-ops.
 */

import { parsePlayerGames, type PlayerGame, type PlayerGames } from '../fetch/players.js';

// ─── Sentinel ─────────────────────────────────────────────────────────────────

/** The canonical score representation for a draw in local tournament data. */
export const DRAW_SCORES = [{ score1: 0, score2: 0 }];

/**
 * Returns true if the given scores array represents a draw sentinel.
 * A draw is { score1: 0, score2: 0 } — achievable only when cross-matched
 * against player details. Real no-score-recorded wins use { score1: 1, score2: 0 }.
 */
export function isDraw(scores: { score1: number; score2: number }[]): boolean {
  return scores.length === 1 && scores[0].score1 === 0 && scores[0].score2 === 0;
}

// ─── Matching ─────────────────────────────────────────────────────────────────

/**
 * Checks whether a PlayerGame from the player details API corresponds to
 * the given game in a tournament stage.
 *
 * Match criteria (all must hold):
 *  1. Tournament name matches (case-insensitive contains).
 *  2. roundStageName matches the division/stage label (e.g. "2. Zusatzrunde").
 *  3. roundName matches the game stage name (e.g. "3. Runde").
 *  4. Every nwtfvId from one competitor appears in either playerIds or
 *     opponentIds, and every nwtfvId from the other competitor appears in
 *     the remaining array.
 */
function isMatchingGame(
  playerGame: PlayerGame,
  tournament: any,
  divisionHeadings: string[],
  stageName: string,
  side1Ids: number[],
  side2Ids: number[],
): boolean {
  // 1. Tournament name
  if (!playerGame.tournamentName.toLowerCase().includes(tournament.name.toLowerCase())) {
    return false;
  }

  // 2. Stage match (runde_stufe ↔ division heading / broader stage)
  if (!divisionHeadings.includes(playerGame.roundStageName)) return false;

  // 3. Round name match   (runde ↔ gameStage.name)
  if (playerGame.roundName !== stageName) return false;

  // 4. Competitor identity: side1 = playerIds, side2 = opponentIds  OR  swapped
  const matchesStraight =
    side1Ids.every(id => playerGame.playerIds.includes(id)) &&
    side2Ids.every(id => playerGame.opponentIds.includes(id));
  const matchesCrossed =
    side1Ids.every(id => playerGame.opponentIds.includes(id)) &&
    side2Ids.every(id => playerGame.playerIds.includes(id));

  return matchesStraight || matchesCrossed;
}

/** Collect all known nwtfvIds from a competitor object (may be 1 or 2 ids). */
function idsFromCompetitor(c: any): number[] {
  if (!c) return [];
  if (c.type === 'player') return c.player?.nwtfvId ? [c.player.nwtfvId] : [];
  const ids: number[] = [];
  if (c.player1?.nwtfvId) ids.push(c.player1.nwtfvId);
  if (c.player2?.nwtfvId) ids.push(c.player2.nwtfvId);
  return ids;
}

/** True if a game is a doubles game (at least one competitor is a team). */
function isDoubles(game: any): boolean {
  return game.competitor1?.type === 'team' || game.competitor2?.type === 'team';
}

// ─── Main patch function ──────────────────────────────────────────────────────

/**
 * Walks all games in the tournament and patches any draws detected from the
 * player details game history.
 *
 * @param tournament  - The local tournament data object (mutated in-place).
 * @param playerGamesMap - Map of nwtfvId → PlayerGames for players in this tournament.
 * @param divisionLabels - Map from skillLevel to the corresponding label used
 *   in the player details runde_stufe field.
 *   Defaults: Pro → "Hauptrunde", Amateur → "Zusatzrunde", Open → "Vorrunde".
 * @returns Number of games patched to a draw result.
 */
export function patchDrawsInTournament(
  tournament: any,
  playerGamesMap: Map<number, PlayerGames>,
  divisionLabels: Record<string, string | string[]> = DEFAULT_DIVISION_LABELS,
): number {
  let patched = 0;

  function patchRound(round: any, roundType: '1. Zusatzrunde' | '2. Zusatzrunde' | string = '') {
    if (!round) return;
    for (const division of round.divisions ?? []) {
      const headingSet = divisionLabels[division.skillLevel] ?? division.skillLevel;
      const headings = Array.isArray(headingSet) ? headingSet : [headingSet];

      for (const stage of division.gameStages ?? []) {
        for (const game of stage.games ?? []) {
          // Skip games already marked as draws
          if (isDraw(game.scores)) continue;

          const doubles = isDoubles(game);
          const side1Ids = idsFromCompetitor(game.competitor1);
          const side2Ids = idsFromCompetitor(game.competitor2);

          // We must have at least one known id on each side to cross-match
          if (side1Ids.length === 0 && side2Ids.length === 0) continue;

          const allKnownIds = [...side1Ids, ...side2Ids];

          // Check any known player's history for a draw on this game
          let foundDraw = false;
          for (const nwtfvId of allKnownIds) {
            const playerGames = playerGamesMap.get(nwtfvId);
            if (!playerGames) continue;

            const gameList = doubles ? playerGames.doppel : playerGames.einzel;

            for (const pg of gameList) {
              if (
                pg.result === 'draw' &&
                isMatchingGame(pg, tournament, headings, stage.name, side1Ids, side2Ids)
              ) {
                foundDraw = true;
                break;
              }
            }

            if (foundDraw) break;
          }

          if (foundDraw) {
            game.scores = DRAW_SCORES;
            patched++;
          }
        }
      }
    }
  }

  // Walk all rounds. The division label for the Zusatzrunde varies between
  // tournaments — the player API uses labels like "Hauptrunde", "Zusatzrunde",
  // "2. Zusatzrunde", "Vorrunde", etc. that map to the skillLevel headings.
  patchRound(tournament.mainRound);
  patchRound(tournament.qualifyingRound);

  return patched;
}

// ─── Division label mapping ───────────────────────────────────────────────────

/**
 * Default mapping from the internal `skillLevel` strings to the
 * `runde_stufe` values used in the player details API.
 *
 * These match the German headings visible on the tournament page and in the
 * player details API response. Can be overridden if tournaments use different
 * terminology.
 */
export const DEFAULT_DIVISION_LABELS: Record<string, string | string[]> = {
  'Pro': 'Hauptrunde',
  'Amateur': 'Zusatzrunde',
  'Open': ['Vorrunde', '2. Zusatzrunde'],
};

/**
 * Builds a Map<nwtfvId, PlayerGames> from an array of raw player JSON blobs
 * (as stored in raw/players/*.json).
 *
 * Accepts the raw JSON (not already parsed) so that callers can pass the
 * result of JSON.parse() on the cached raw files directly.
 */
export function buildPlayerGamesMap(rawPlayerJsons: any[]): Map<number, PlayerGames> {
  const map = new Map<number, PlayerGames>();
  for (const raw of rawPlayerJsons) {
    try {
      const games = parsePlayerGames(raw);
      const id = parseInt(raw?.data?.spieler?.spieler_id, 10);
      if (!isNaN(id)) map.set(id, games);
    } catch {
      // Ignore malformed player JSON
    }
  }
  return map;
}
