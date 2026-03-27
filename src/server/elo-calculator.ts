/**
 * elo-calculator.ts
 *
 * Pure ELO rating calculation module — no database dependencies.
 * Implements the standard ELO formula with support for:
 *   - Single (1v1)
 *   - Double (2v2 fixed teams)
 *   - DYP (2v2 random partners)
 *   - Total ELO (updated after every match)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_ELO = 1500;
export const DEFAULT_K_FACTOR = 32;

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameType = 'single' | 'double' | 'dyp';

/** The 4 distinct ELO ratings every player tracks. */
export interface PlayerRatings {
  singleElo: number;
  doubleElo: number;
  dypElo: number;
  totalElo: number;
}

/** A player with an ID and their current ratings. */
export interface PlayerWithRatings {
  id: string;
  ratings: PlayerRatings;
}

/** Input describing a match to be recorded. */
export interface MatchInput {
  gameType: GameType;
  team1: PlayerWithRatings[];   // 1 player for single, 2 for double/dyp
  team2: PlayerWithRatings[];   // 1 player for single, 2 for double/dyp
  team1Won: boolean;
  kFactor?: number;
}

/** ELO changes for a single player after a match. */
export interface PlayerEloUpdate {
  playerId: string;
  /** Delta for the game-specific ELO (single/double/dyp). */
  specificEloDelta: number;
  /** Delta for the total ELO. */
  totalEloDelta: number;
  /** New absolute game-specific ELO value. */
  newSpecificElo: number;
  /** New absolute total ELO value. */
  newTotalElo: number;
  /** Old game-specific ELO before this match. */
  oldSpecificElo: number;
  /** Old total ELO before this match. */
  oldTotalElo: number;
}

/** Result of recording a match — ELO updates for all players. */
export interface MatchResult {
  gameType: GameType;
  team1Updates: PlayerEloUpdate[];
  team2Updates: PlayerEloUpdate[];
}

// ─── Core ELO Math ────────────────────────────────────────────────────────────

/**
 * Calculate the expected score for player/team A against player/team B.
 *
 * $$E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate the ELO delta (change) for a player.
 *
 * $$\Delta = K \cdot (S - E_A)$$
 *
 * @returns The delta to add to the current rating (can be negative).
 */
export function calculateEloDelta(
  rating: number,
  opponentRating: number,
  won: boolean,
  kFactor: number = DEFAULT_K_FACTOR,
): number {
  const expectedScore = calculateExpectedScore(rating, opponentRating);
  const actualScore = won ? 1 : 0;
  return kFactor * (actualScore - expectedScore);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get the game-specific ELO key from a GameType. */
function getSpecificEloKey(gameType: GameType): keyof PlayerRatings {
  switch (gameType) {
    case 'single': return 'singleElo';
    case 'double': return 'doubleElo';
    case 'dyp':    return 'dypElo';
  }
}

/** Average of numbers. */
function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Record a match and calculate ELO updates for all involved players.
 *
 * **Single (1v1):**
 *   - Uses each player's `singleElo` for game-specific delta.
 *   - Uses each player's `totalElo` for total delta.
 *
 * **Double / DYP (2v2):**
 *   - Team rating = average of both players' game-specific ELO.
 *   - Delta is calculated at the team level, then applied equally to both players.
 *   - Total ELO uses team averages of `totalElo`.
 *
 * @param input - The match data.
 * @returns ELO updates for every player.
 */
export function recordMatch(input: MatchInput): MatchResult {
  const { gameType, team1, team2, team1Won, kFactor = DEFAULT_K_FACTOR } = input;
  const eloKey = getSpecificEloKey(gameType);

  // ── Game-specific ELO calculation ──────────────────────────────────────

  const team1SpecificRatings = team1.map(p => p.ratings[eloKey]);
  const team2SpecificRatings = team2.map(p => p.ratings[eloKey]);

  const team1AvgSpecific = average(team1SpecificRatings);
  const team2AvgSpecific = average(team2SpecificRatings);

  // For singles, each player uses their own rating against the opponent's.
  // For doubles, we use team average vs team average.
  const specificDeltaTeam1 = Math.round(calculateEloDelta(team1AvgSpecific, team2AvgSpecific, team1Won, kFactor));
  const specificDeltaTeam2 = Math.round(calculateEloDelta(team2AvgSpecific, team1AvgSpecific, !team1Won, kFactor));

  // ── Total ELO calculation (always uses totalElo as input) ──────────────

  const team1TotalRatings = team1.map(p => p.ratings.totalElo);
  const team2TotalRatings = team2.map(p => p.ratings.totalElo);

  const team1AvgTotal = average(team1TotalRatings);
  const team2AvgTotal = average(team2TotalRatings);

  const totalDeltaTeam1 = Math.round(calculateEloDelta(team1AvgTotal, team2AvgTotal, team1Won, kFactor));
  const totalDeltaTeam2 = Math.round(calculateEloDelta(team2AvgTotal, team1AvgTotal, !team1Won, kFactor));

  // ── Build per-player updates ──────────────────────────────────────────

  const buildUpdate = (
    player: PlayerWithRatings,
    specificDelta: number,
    totalDelta: number,
  ): PlayerEloUpdate => ({
    playerId: player.id,
    oldSpecificElo: player.ratings[eloKey],
    oldTotalElo: player.ratings.totalElo,
    specificEloDelta: specificDelta,
    totalEloDelta: totalDelta,
    newSpecificElo: Math.round(player.ratings[eloKey] + specificDelta),
    newTotalElo: Math.round(player.ratings.totalElo + totalDelta),
  });

  const team1Updates = team1.map(p => buildUpdate(p, specificDeltaTeam1, totalDeltaTeam1));
  const team2Updates = team2.map(p => buildUpdate(p, specificDeltaTeam2, totalDeltaTeam2));

  return { gameType, team1Updates, team2Updates };
}

/**
 * Maps a tournament type string (from nwtfv.com) to a GameType.
 *
 * Known tournament types from the data:
 *   "Offenes Doppel", "Doppel", "DYP", "Einzel", "Offenes Einzel",
 *   "Mixed", "Monster-DYP", etc.
 */
export function tournamentTypeToGameType(tournamentType: string): GameType {
  const t = tournamentType.toLowerCase();

  if (t.includes('einzel')) return 'single';
  if (t.includes('dyp'))    return 'dyp';
  // Everything else (Doppel, Offenes Doppel, Mixed, etc.) is treated as double
  return 'double';
}

/**
 * Maps a GameType to the corresponding EloType enum value
 * (as defined in the Prisma schema).
 */
export function gameTypeToEloType(gameType: GameType): 'single' | 'double' | 'dyp' {
  return gameType; // They happen to be identical strings
}

/**
 * Creates a default PlayerRatings object with all values set to DEFAULT_ELO.
 */
export function createDefaultRatings(): PlayerRatings {
  return {
    singleElo: DEFAULT_ELO,
    doubleElo: DEFAULT_ELO,
    dypElo: DEFAULT_ELO,
    totalElo: DEFAULT_ELO,
  };
}
