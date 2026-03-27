import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateEloForExistingGame } from '../src/server/elo-transaction.js';

describe('ELO Integration (New History Format)', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      player: {
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
      },
      eloHistory: {
        create: vi.fn(),
        createMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };
  });

  it('should create only one EloHistory record per player per match with new fields', async () => {
    // Mock player ratings
    mockPrisma.player.findUniqueOrThrow.mockResolvedValueOnce({
      id: 'p1',
      singleElo: 1500,
      doubleElo: 1500,
      dypElo: 1500,
      totalElo: 1500,
    });
    mockPrisma.player.findUniqueOrThrow.mockResolvedValueOnce({
      id: 'p2',
      singleElo: 1500,
      doubleElo: 1500,
      dypElo: 1500,
      totalElo: 1500,
    });

    const input = {
      gameId: 'g1',
      t1Player1Id: 'p1',
      t2Player1Id: 'p2',
      scores: [{ score1: 5, score2: 0 }],
      tournamentType: 'Einzel',
      gameDate: new Date('2024-01-01'),
    };

    await updateEloForExistingGame(input, mockPrisma);

    // Should update 2 players
    expect(mockPrisma.player.update).toHaveBeenCalledTimes(2);

    // Should create exactly 2 EloHistory records (one per player)
    expect(mockPrisma.eloHistory.createMany).toHaveBeenCalledTimes(1);

    // Check content of the first record (p1)
    const call1 = mockPrisma.eloHistory.createMany.mock.calls[0][0];
    expect(call1.data).toHaveLength(2);
    const record1 = call1.data[0];
    const record2 = call1.data[1];
    expect(record1).toHaveProperty('playerId', 'p1');
    expect(record1).toHaveProperty('gameId', 'g1');
    expect(record1).toHaveProperty('type', 'single');
    expect(record1).toHaveProperty('eloValue');
    expect(record1).toHaveProperty('eloValueTotal');
    expect(record1).toHaveProperty('change');
    
    // With equal ratings and winning 5:0 (win), change should be exactly 16
    expect(record1.change).toBe(16);
    expect(record1.eloValue).toBe(1516);
    expect(record1.eloValueTotal).toBe(1516);
  });
});
