import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlayerByNwtfvId } from '../../src/server/api.js';
import { prisma } from '../../src/server/prisma.js';

vi.mock('../../src/server/prisma.js', () => ({
  prisma: {
    player: {
      findUnique: vi.fn(),
    },
  },
}));

describe('api - getPlayerByNwtfvId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass correct parameters to findUnique', async () => {
    vi.mocked(prisma.player.findUnique).mockResolvedValueOnce(null);
    await getPlayerByNwtfvId(123);

    expect(prisma.player.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { nwtfvId: 123 }
    }));
  });

  it('should format returned player object and slice to exactly 10 games', async () => {
    const makeGames = (count: number, startTs: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `game-${startTs}-${i}`,
        createdAt: new Date(startTs + i * 1000),
      }));
    };

    const mockPlayer = {
      id: 'player-1',
      nwtfvId: 123,
      gamesAsT1P1: makeGames(3, 10000), // oldest
      gamesAsT1P2: makeGames(4, 50000),
      gamesAsT2P1: makeGames(2, 80000),
      gamesAsT2P2: makeGames(5, 100000), // newest
    };

    vi.mocked(prisma.player.findUnique).mockResolvedValueOnce(mockPlayer as any);

    const result = await getPlayerByNwtfvId(123);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('player-1');
    expect(result!.recentGames).toHaveLength(10);

    // Check sorting (newest first)
    const recentGames = result!.recentGames;
    for (let i = 0; i < recentGames.length - 1; i++) {
      expect(recentGames[i].createdAt.getTime()).toBeGreaterThanOrEqual(recentGames[i + 1].createdAt.getTime());
    }

    // Newest game should be from gamesAsT2P2
    expect(recentGames[0].createdAt.getTime()).toBe(104000);
  });

  it('should return null if player not found', async () => {
    vi.mocked(prisma.player.findUnique).mockResolvedValueOnce(null);
    const result = await getPlayerByNwtfvId(999);
    expect(result).toBeNull();
  });
});
