import { PrismaClient } from '../generated/prisma/client.js';
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
  /** DD.MM.YYYY — when set, only recalculate ELO for games from this date onward */
  fromDate?: string;
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
  const { prisma, log = true, fromDate } = options;

  if (fromDate) {
    if (log) console.log(`📊 Partial ELO recalculation from ${fromDate}...\n`);

    const cutoff = new Date(fromDate.split('.').reverse().join('-')); // DD.MM.YYYY → Date

    // Delete EloHistory records on/after the cutoff date
    await prisma.eloHistory.deleteMany({ where: { date: { gte: cutoff } } });

    // Fetch all games on/after the cutoff (filter by tournament date in-memory)
    const allGamesRaw = await prisma.game.findMany({
      include: { tournament: { select: { type: true, date: true } } },
    });
    const fromDateTs = parseDate(fromDate);
    const allGamesFromDate = allGamesRaw.filter(g => parseDate(g.tournament.date) >= fromDateTs);

    // For each affected player, restore their rating from the last remaining EloHistory
    // record before the cutoff (or 1500 if none)
    const affectedPlayerIds = new Set<string>();
    for (const g of allGamesFromDate) {
      [g.t1Player1Id, g.t1Player2Id, g.t2Player1Id, g.t2Player2Id].forEach(id => {
        if (id) affectedPlayerIds.add(id);
      });
    }

    const playerRatingsMap = new Map<string, PlayerRatings>();

    for (const playerId of affectedPlayerIds) {
      // Get last EloHistory per type before cutoff
      const lastHistories = await prisma.eloHistory.findMany({
        where: { playerId, date: { lt: cutoff } },
        orderBy: { date: 'desc' },
        take: 3, // at most one per type (single/double/dyp)
      });

      const ratings: PlayerRatings = { singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 };
      for (const h of lastHistories) {
        const key = h.type === 'single' ? 'singleElo' : h.type === 'double' ? 'doubleElo' : 'dypElo';
        if (ratings[key] === 1500) {
          ratings[key] = h.eloValue;
          ratings.totalElo = h.eloValueTotal; // overwritten each time, last wins (fine)
        }
      }
      playerRatingsMap.set(playerId, ratings);
    }

    // Also seed non-affected players (they won't be written back unless they appear in games)
    const allPlayers = await prisma.player.findMany({ where: { id: { notIn: Array.from(affectedPlayerIds) } } });
    for (const p of allPlayers) {
      playerRatingsMap.set(p.id, {
        singleElo: p.singleElo,
        doubleElo: p.doubleElo,
        dypElo: p.dypElo,
        totalElo: p.totalElo,
      });
    }

    const sortedGames = sortGamesChronologically(allGamesFromDate);
    return processGames({ prisma, log, playerRatingsMap, sortedGames, affectedPlayerIds });
  }

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
      singleElo: 1500,
      doubleElo: 1500,
      dypElo: 1500,
      totalElo: 1500,
    });
  }

  const sortedGames = sortGamesChronologically(allGames);
  return processGames({ prisma, log, playerRatingsMap, sortedGames });
}

async function processGames({
  prisma,
  log,
  playerRatingsMap,
  sortedGames,
  affectedPlayerIds,
}: {
  prisma: PrismaClient;
  log: boolean;
  playerRatingsMap: Map<string, PlayerRatings>;
  sortedGames: GameWithTournament[];
  affectedPlayerIds?: Set<string>;
}): Promise<{ processed: number; errors: number }> {
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
          ratings = { singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 };
          playerRatingsMap.set(id, ratings);
        }
        return { id, ratings: { ...ratings } };
      };

      const team1 = team1Ids.map(fetchPlayerFromMemory);
      const team2 = team2Ids.map(fetchPlayerFromMemory);

      // Calculate new ELOs
      const result = recordMatch({ gameType, team1, team2, team1Won });

      const eloKey = gameType === 'single' ? 'singleElo' :
                     gameType === 'double' ? 'doubleElo' : 'dypElo';

      const allUpdates = [...result.team1Updates, ...result.team2Updates];

      // Update our in-memory map and queue history records
      for (const update of allUpdates) {
        const currentRatings = playerRatingsMap.get(update.playerId)!;
        currentRatings[eloKey] = update.newSpecificElo;
        currentRatings.totalElo = update.newTotalElo;

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
        console.log(`   ELO progress: ${i + 1}/${sortedGames.length} — ${game.tournament.date}`);
      }
    } catch (err) {
      errors++;
      if (log && errors <= 5) {
        console.error(`   ⚠ ELO error for game ${game.id}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  if (log) console.log(`   Syncing ${historyRecordsToInsert.length} history records to DB...`);

  // Batch insert history records
  const BATCH_SIZE = 5000;
  for (let i = 0; i < historyRecordsToInsert.length; i += BATCH_SIZE) {
    const batch = historyRecordsToInsert.slice(i, i + BATCH_SIZE);
    await prisma.eloHistory.createMany({ data: batch });
  }

  // Update only the players whose ratings changed (affected in partial mode, all in full mode)
  const playerIdsToUpdate = affectedPlayerIds ?? new Set(playerRatingsMap.keys());
  const playerUpdatePromises: any[] = [];
  for (const id of playerIdsToUpdate) {
    const ratings = playerRatingsMap.get(id);
    if (ratings) {
      playerUpdatePromises.push(
        prisma.player.update({ where: { id }, data: ratings })
      );
    }
  }

  const PLAYER_BATCH_SIZE = 50;
  for (let i = 0; i < playerUpdatePromises.length; i += PLAYER_BATCH_SIZE) {
    const batch = playerUpdatePromises.slice(i, i + PLAYER_BATCH_SIZE);
    await prisma.$transaction(batch);
  }

  if (log) console.log(`\n   ELO processed: ${processed} games (${errors} errors)\n`);
  return { processed, errors };
}
