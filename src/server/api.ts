/**
 * Prisma Query Functions (API Layer)
 * 
 * These functions replace direct JSON stub imports in the frontend.
 * They are called by Express route handlers and return structured data.
 */

import { prisma } from './prisma.js';
import type { EloType } from '../generated/prisma/client.js';

/**
 * Fetches and formats a player profile by any unique criteria.
 */
async function fetchAndFormatPlayerProfile(where: any) {
  const player = await prisma.player.findUnique({
    where,
    include: {
      rankings: {
        orderBy: [{ year: 'desc' }, { rank: 'asc' }],
      },
      eloHistory: {
        orderBy: { date: 'desc' },
        take: 4, // Latest ELO per type (at most 4 types)
        distinct: ['type'],
      },
      // Recent games where this player was involved (any position)
      gamesAsT1P1: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tournament: true,
          t1Player1: true,
          t1Player2: true,
          t2Player1: true,
          t2Player2: true,
        },
      },
      gamesAsT1P2: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tournament: true,
          t1Player1: true,
          t1Player2: true,
          t2Player1: true,
          t2Player2: true,
        },
      },
      gamesAsT2P1: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tournament: true,
          t1Player1: true,
          t1Player2: true,
          t2Player1: true,
          t2Player2: true,
        },
      },
      gamesAsT2P2: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tournament: true,
          t1Player1: true,
          t1Player2: true,
          t2Player1: true,
          t2Player2: true,
        },
      },
    } as any,
  });

  if (!player) return null;

  // Merge all game relations into a single sorted list
  const allGames = [
    ...(player as any).gamesAsT1P1,
    ...(player as any).gamesAsT1P2,
    ...(player as any).gamesAsT2P1,
    ...(player as any).gamesAsT2P2,
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return {
    ...player,
    recentGames: allGames,
  };
}

/**
 * Fetches a complete player profile with rankings, latest ELO scores,
 * and recent games. Used by PlayerPage.jsx.
 */
export async function getPlayerProfile(playerId: string) {
  return fetchAndFormatPlayerProfile({ id: playerId });
}

/**
 * Fetches a player profile by their NWTFV ID (the external identifier).
 * Useful when navigating from parsed tournament data.
 */
export async function getPlayerByNwtfvId(nwtfvId: number) {
  return fetchAndFormatPlayerProfile({ nwtfvId });
}

/**
 * Fetches full ELO history for a player, optionally filtered by type.
 * Used for the "Performance Trend" chart on PlayerPage.jsx.
 */
export async function getPlayerEloHistory(playerId: string, eloType?: EloType) {
  return prisma.eloHistory.findMany({
    where: {
      playerId,
      ...(eloType ? { type: eloType } : {}),
    },
    orderBy: { date: 'asc' },
    include: {
      game: {
        include: {
          tournament: {
            select: { name: true, date: true, place: true },
          },
        },
      },
    },
  });
}

/**
 * Search players by name/surname. Used by PlayerSearch.jsx.
 */
export async function searchPlayers(query: string, limit = 5) {
  if (!query.trim()) return [];

  return prisma.player.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { surname: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      nwtfvId: true,
      name: true,
      surname: true,
      avatarUrl: true,
      clubs: true,
    },
    take: limit,
  });
}

/**
 * Fetches top players ranked by their latest "main" ELO.
 * Used by TopPlayers.jsx.
 */
export async function getTopPlayers(limit = 5) {
  // Get players with their latest 'main' ELO
  const latestElos = await prisma.eloHistory.findMany({
    where: { type: 'main' },
    orderBy: { date: 'desc' },
    distinct: ['playerId'],
    take: 100, // Get a pool to sort from
    include: {
      player: {
        select: {
          id: true,
          nwtfvId: true,
          name: true,
          surname: true,
          avatarUrl: true,
          category: true,
          clubs: true,
        },
      },
    },
  });

  return latestElos
    .sort((a, b) => b.eloValue - a.eloValue)
    .slice(0, limit)
    .map((elo) => ({
      ...elo.player,
      mainElo: elo.eloValue,
    }));
}

/**
 * Fetches full tournament details by the NWTFV identifier (integer).
 * Used for /tournament/nwtfv/:nwtfvId routing.
 */
export async function getTournamentByNwtfvId(nwtfvId: number) {
  return prisma.tournament.findUnique({
    where: { nwtfvId },
    include: {
      rounds: {
        include: {
          placements: {
            orderBy: { rank: 'asc' },
            include: {
              player1: {
                select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true, clubs: true },
              },
              player2: {
                select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true, clubs: true },
              },
            },
          },
          divisions: {
            include: {
              gameStages: {
                include: {
                  games: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                      t1Player1: { select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true } },
                      t1Player2: { select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true } },
                      t2Player1: { select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true } },
                      t2Player2: { select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}
/**
 * Fetches paginated tournament list. Used by TournamentsPage.jsx.
 */
export async function getTournamentsList(options?: {
  search?: string;
  city?: string;
  type?: string;
  skip?: number;
  take?: number;
}) {
  const { search, city, type, skip = 0, take = 20 } = options ?? {};

  return prisma.tournament.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        city ? { place: city } : {},
        type ? { type } : {},
      ],
    },
    orderBy: { date: 'desc' },
    skip,
    take,
    include: {
      rounds: {
        include: {
          placements: {
            where: { rank: 1 },
            include: {
              player1: { select: { name: true, surname: true, avatarUrl: true } },
              player2: { select: { name: true, surname: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * Fetches full tournament details with all nested relations.
 * Used by TournamentDetailsPage.jsx.
 * 
 * Efficiently loads the full hierarchy: Tournament → Rounds → Divisions → 
 * GameStages → Games (with player data) + Placements (with player data).
 */
export async function getTournamentDetails(tournamentId: string) {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      rounds: {
        include: {
          placements: {
            orderBy: { rank: 'asc' },
            include: {
              player1: {
                select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true, clubs: true },
              },
              player2: {
                select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true, clubs: true },
              },
            },
          },
          divisions: {
            include: {
              gameStages: {
                include: {
                  games: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                      t1Player1: { select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true } },
                      t1Player2: { select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true } },
                      t2Player1: { select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true } },
                      t2Player2: { select: { id: true, nwtfvId: true, name: true, surname: true, avatarUrl: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}
