import { PrismaClient } from '../generated/prisma/client.js';
import { updateEloForExistingGame } from '../server/elo-transaction.js';
import {
  recordMatch,
  tournamentTypeToGameType,
  gameTypeToEloType,
  type PlayerRatings,
  type PlayerWithRatings
} from '../server/elo-calculator.js';

export interface GameWithTournament {
  id: string;
  createdAt: Date;
  t1Player1Id: string;
  t1Player2Id: string | null;
  t2Player1Id: string;
  t2Player2Id: string | null;
  scores: any;
  tournament: {
    date: string;
    type: string;
  };
}

export interface RecalculateOptions {
  prisma: PrismaClient;
  log?: boolean;
}

/**
 * Parses a date string in DD.MM.YYYY format into a timestamp.
 */
export function parseDate(d: string): number {
  const [day, month, yearStr] = d.split('.');
  return new Date(`${yearStr}-${month}-${day}`).getTime();
}

/**
 * Sorts games chronologically by tournament date, then by createdAt.
 */
export function sortGamesChronologically(games: GameWithTournament[]): GameWithTournament[] {
  return [...games].sort((a, b) => {
    const dateDiff = parseDate(a.tournament.date) - parseDate(b.tournament.date);
    if (dateDiff !== 0) return dateDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Resets all player ratings to 1500 and clears ELO history.
 */
export async function resetAllRatings(prisma: PrismaClient): Promise<void> {
  await prisma.player.updateMany({
    data: { singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
  });
  await prisma.eloHistory.deleteMany({});
}

/**
 * Recalculates all ELO ratings from scratch.
 * Optimized to perform calculations in-memory and batch updates to the database.
 */
export async function recalculateAllElos(options: RecalculateOptions): Promise<{ processed: number; errors: number }> {
  const { prisma, log = true } = options;

  if (log) console.log('📊 Recalculating ELO ratings for all games...\n');

  await resetAllRatings(prisma);

  // 1. Fetch all games and players into memory
  const allGames = await prisma.game.findMany({
    include: {
      tournament: { select: { type: true, date: true } },
    },
  });

  const allPlayers = await prisma.player.findMany();

  // Create an in-memory map of player ratings
  const playerRatingsMap = new Map<string, PlayerRatings>();
  for (const p of allPlayers) {
    playerRatingsMap.set(p.id, {
      singleElo: 1500, // We just reset them to 1500
      doubleElo: 1500,
      dypElo: 1500,
      totalElo: 1500,
    });
  }

  const sortedGames = sortGamesChronologically(allGames);

  let processed = 0;
  let errors = 0;

  // We will collect all history records to insert them in batches
  const historyRecordsToInsert: any[] = [];

  for (let i = 0; i < sortedGames.length; i++) {
    const game = sortedGames[i];
    try {
      const [day, month, yearStr] = game.tournament.date.split('.');
      const gameDate = new Date(`${yearStr}-${month}-${day}`);
      const tournamentType = game.tournament.type;
      
      const gameType = tournamentTypeToGameType(tournamentType);
      const eloType = gameTypeToEloType(gameType);

      // Determine winner
      const scores = game.scores as { score1: number; score2: number }[];
      const t1Wins = scores.filter(s => s.score1 > s.score2).length;
      const t2Wins = scores.filter(s => s.score2 > s.score1).length;
      const team1Won = t1Wins > t2Wins;

      const team1Ids = [game.t1Player1Id, game.t1Player2Id].filter(Boolean) as string[];
      const team2Ids = [game.t2Player1Id, game.t2Player2Id].filter(Boolean) as string[];

      // Create PlayerWithRatings objects from our memory map
      const fetchPlayerFromMemory = (id: string): PlayerWithRatings => {
        let ratings = playerRatingsMap.get(id);
        if (!ratings) {
          // If a player somehow doesn't exist in our map, initialize them with 1500
          ratings = { singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 };
          playerRatingsMap.set(id, ratings);
        }
        return { id, ratings: { ...ratings } };
      };

      const team1 = team1Ids.map(fetchPlayerFromMemory);
      const team2 = team2Ids.map(fetchPlayerFromMemory);

      // Calculate new ELOs
      const result = recordMatch({
        gameType,
        team1,
        team2,
        team1Won,
      });

      const eloKey = gameType === 'single' ? 'singleElo' :
                     gameType === 'double' ? 'doubleElo' : 'dypElo';

      const allUpdates = [...result.team1Updates, ...result.team2Updates];

      // Update our in-memory map and queue history records
      for (const update of allUpdates) {
        // Update memory map
        const currentRatings = playerRatingsMap.get(update.playerId)!;
        currentRatings[eloKey] = update.newSpecificElo;
        currentRatings.totalElo = update.newTotalElo;

        // Queue history record
        historyRecordsToInsert.push({
          playerId: update.playerId,
          gameId: game.id,
          date: gameDate,
          type: eloType,
          eloValue: update.newSpecificElo,
          eloValueTotal: update.newTotalElo,
          change: update.totalEloDelta,
        });
      }

      processed++;

      if (log && ((i + 1) % 500 === 0 || i === sortedGames.length - 1)) {
        console.log(`   ELO progress: ${i + 1}/${sortedGames.length} games processed in memory`);
      }
    } catch (err) {
      errors++;
      if (log && errors <= 5) {
        console.error(`   ⚠ ELO error for game ${game.id}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  if (log) console.log(`   Syncing ${historyRecordsToInsert.length} history records and ${playerRatingsMap.size} player updates to DB...`);

  // 2. Batch Update the Database
  // Create history records in batches to avoid query size limits
  const BATCH_SIZE = 5000;
  for (let i = 0; i < historyRecordsToInsert.length; i += BATCH_SIZE) {
    const batch = historyRecordsToInsert.slice(i, i + BATCH_SIZE);
    await prisma.eloHistory.createMany({
      data: batch
    });
  }

  // Update players using a transaction
  const playerUpdatePromises: any[] = [];
  for (const [id, ratings] of playerRatingsMap.entries()) {
    playerUpdatePromises.push(
      prisma.player.update({
        where: { id },
        data: ratings,
      })
    );
  }

  // Since Prisma SQLite doesn't exist here, Postgres $transaction is fine.
  // Execute updates in batches so we don't blow up connection pool or statement limits
  const PLAYER_BATCH_SIZE = 50;
  for (let i = 0; i < playerUpdatePromises.length; i += PLAYER_BATCH_SIZE) {
    const batch = playerUpdatePromises.slice(i, i + PLAYER_BATCH_SIZE);
    await prisma.$transaction(batch);
  }

  if (log) console.log(`\n   ELO processed: ${processed} games (${errors} errors)\n`);
  return { processed, errors };
}
