/**
 * elo-transaction.ts
 *
 * Database integration layer for ELO calculations.
 * Uses Prisma's $transaction API to atomically:
 *   1. Create a Game record (or reference an existing one)
 *   2. Update Player ELO fields
 *   3. Insert EloHistory records for audit trail
 *
 * This prevents race conditions — if any step fails, the entire
 * transaction rolls back and no partial data is persisted.
 */

import { prisma } from './prisma.js';
import { PrismaClient, Prisma, type EloType } from '../generated/prisma/client.js';
import {
  recordMatch,
  tournamentTypeToGameType,
  gameTypeToEloType,
  type GameType,
  type PlayerWithRatings,
  type MatchResult,
  DEFAULT_ELO,
} from './elo-calculator.js';
import { isDraw } from '../transform/reconcile-draws.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameInput {
  tournamentId: string;
  roundId: string;
  divisionId: string;
  gameStageId: string;
  t1Player1Id: string;
  t1Player2Id?: string;
  t2Player1Id: string;
  t2Player2Id?: string;
  scores: { score1: number; score2: number }[];
  /** The tournament type string, e.g. "Offenes Doppel", "DYP", "Einzel" */
  tournamentType: string;
  kFactor?: number;
}

export interface EloGameInput {
  gameId: string;
  t1Player1Id: string;
  t1Player2Id?: string;
  t2Player1Id: string;
  t2Player2Id?: string;
  scores: { score1: number; score2: number }[];
  tournamentType: string;
  gameDate: Date;
  kFactor?: number;
}

// ─── Transaction: Create Game + Update ELO ────────────────────────────────────

/**
 * Atomically creates a Game and updates ELO for all involved players.
 */
export async function createGameWithEloUpdate(input: GameInput, client: PrismaClient = prisma) {
  return client.$transaction(async (tx: Prisma.TransactionClient) => {
    // Step 1: Create the Game
    const game = await tx.game.create({
      data: {
        tournamentId: input.tournamentId,
        roundId: input.roundId,
        divisionId: input.divisionId,
        gameStageId: input.gameStageId,
        t1Player1Id: input.t1Player1Id,
        t1Player2Id: input.t1Player2Id,
        t2Player1Id: input.t2Player1Id,
        t2Player2Id: input.t2Player2Id,
        scores: input.scores,
      },
    });

    // Step 2: Process ELO for this game
    const result = await processGameElo(tx, {
      gameId: game.id,
      t1Player1Id: input.t1Player1Id,
      t1Player2Id: input.t1Player2Id,
      t2Player1Id: input.t2Player1Id,
      t2Player2Id: input.t2Player2Id,
      scores: input.scores,
      tournamentType: input.tournamentType,
      gameDate: new Date(),
      kFactor: input.kFactor,
    });

    return { game, eloResult: result };
  });
}

// ─── Transaction: Update ELO for Existing Game ────────────────────────────────

/**
 * Updates ELO for an already-existing Game record.
 * Used during batch recalculation (e.g. db:seed).
 */
export async function updateEloForExistingGame(input: EloGameInput, client: PrismaClient = prisma) {
  return client.$transaction(async (tx: Prisma.TransactionClient) => {
    return processGameElo(tx, input);
  });
}

// ─── Core ELO Processing (runs inside a transaction) ──────────────────────────

async function processGameElo(tx: Prisma.TransactionClient, input: EloGameInput): Promise<MatchResult | null> {
  const gameType = tournamentTypeToGameType(input.tournamentType);
  const eloType: EloType = gameTypeToEloType(gameType);

  // Draw sentinel: no ELO changes for either team.
  if (isDraw(input.scores)) {
    return null;
  }

  // Determine winner
  const t1Wins = input.scores.filter(s => s.score1 > s.score2).length;
  const t2Wins = input.scores.filter(s => s.score2 > s.score1).length;
  const team1Won = t1Wins > t2Wins;

  // Gather player IDs
  const team1Ids = [input.t1Player1Id, input.t1Player2Id].filter(Boolean) as string[];
  const team2Ids = [input.t2Player1Id, input.t2Player2Id].filter(Boolean) as string[];

  // Fetch current ELO ratings for all players in a single query
  const allPlayerIds = [...team1Ids, ...team2Ids];
  const uniquePlayerIds = Array.from(new Set(allPlayerIds));

  const players = await tx.player.findMany({
    where: { id: { in: uniquePlayerIds } },
  });

  if (players.length !== uniquePlayerIds.length) {
    throw new Error(`Expected to find ${uniquePlayerIds.length} players, but found ${players.length}. Some player IDs do not exist.`);
  }

  const playerMap = new Map<string, PlayerWithRatings>(
    players.map(p => [
      p.id,
      {
        id: p.id,
        ratings: {
          singleElo: p.singleElo,
          doubleElo: p.doubleElo,
          dypElo: p.dypElo,
          totalElo: p.totalElo,
        },
      },
    ])
  );

  const team1 = team1Ids.map(id => playerMap.get(id)!);
  const team2 = team2Ids.map(id => playerMap.get(id)!);

  // Calculate ELO changes
  const result = recordMatch({
    gameType,
    team1,
    team2,
    team1Won,
    kFactor: input.kFactor,
  });

  // Apply updates: Player ELO fields + EloHistory records
  const eloKey = gameType === 'single' ? 'singleElo' :
                 gameType === 'double' ? 'doubleElo' : 'dypElo';

  const allUpdates = [...result.team1Updates, ...result.team2Updates];

  const historyRecords = [];

  for (const update of allUpdates) {
    // Update Player's live ELO fields
    await tx.player.update({
      where: { id: update.playerId },
      data: {
        [eloKey]: update.newSpecificElo,
        totalElo: update.newTotalElo,
      },
    });

    // Accumulate EloHistory records for this game
    historyRecords.push({
      playerId: update.playerId,
      gameId: input.gameId,
      date: input.gameDate,
      type: eloType,
      eloValue: update.newSpecificElo,
      eloValueTotal: update.newTotalElo,
      change: update.totalEloDelta,
    });
  }

  if (historyRecords.length > 0) {
    await tx.eloHistory.createMany({
      data: historyRecords,
    });
  }

  return result;
}
