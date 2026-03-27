import { PrismaClient } from '../generated/prisma/client.js';
import { updateEloForExistingGame } from '../server/elo-transaction.js';

export interface RecalculateOptions {
  prisma: any;
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
export function sortGamesChronologically(games: any[]): any[] {
  return [...games].sort((a, b) => {
    const dateDiff = parseDate(a.tournament.date) - parseDate(b.tournament.date);
    if (dateDiff !== 0) return dateDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Resets all player ratings to 1500 and clears ELO history.
 */
export async function resetAllRatings(prisma: any): Promise<void> {
  await prisma.player.updateMany({
    data: { singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
  });
  await prisma.eloHistory.deleteMany({});
}

/**
 * Recalculates all ELO ratings from scratch.
 */
export async function recalculateAllElos(options: RecalculateOptions): Promise<{ processed: number; errors: number }> {
  const { prisma, log = true } = options;

  if (log) console.log('📊 Recalculating ELO ratings for all games...\n');

  await resetAllRatings(prisma);

  const allGames = await prisma.game.findMany({
    include: {
      tournament: { select: { type: true, date: true } },
    },
  });

  const sortedGames = sortGamesChronologically(allGames);

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < sortedGames.length; i++) {
    const game = sortedGames[i];
    try {
      const [day, month, yearStr] = game.tournament.date.split('.');
      const gameDate = new Date(`${yearStr}-${month}-${day}`);

      await updateEloForExistingGame({
        gameId: game.id,
        t1Player1Id: game.t1Player1Id,
        t1Player2Id: game.t1Player2Id ?? undefined,
        t2Player1Id: game.t2Player1Id,
        t2Player2Id: game.t2Player2Id ?? undefined,
        scores: game.scores as { score1: number; score2: number }[],
        tournamentType: game.tournament.type,
        gameDate,
      }, prisma); // We pass prisma here to allow for mock/tx
      
      processed++;

      if (log && ((i + 1) % 50 === 0 || i === sortedGames.length - 1)) {
        console.log(`   ELO progress: ${i + 1}/${sortedGames.length} games processed`);
      }
    } catch (err) {
      errors++;
      if (log && errors <= 5) {
        console.error(`   ⚠ ELO error for game ${game.id}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  if (log) console.log(`\n   ELO processed: ${processed} games (${errors} errors)\n`);
  return { processed, errors };
}
