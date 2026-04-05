import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sortGamesChronologically, recalculateAllElos } from '../src/upload/elo-recalculator.js';

describe('elo-recalculator', () => {
  describe('sortGamesChronologically', () => {
    it('should sort games by tournament date', () => {
      const games = [
        { id: 'g1', tournament: { date: new Date('2024-01-02') }, createdAt: new Date(100) },
        { id: 'g2', tournament: { date: new Date('2024-01-01') }, createdAt: new Date(200) },
        { id: 'g3', tournament: { date: new Date('2023-01-01') }, createdAt: new Date(300) },
      ];

      const sorted = sortGamesChronologically(games);
      expect(sorted[0].id).toBe('g3');
      expect(sorted[1].id).toBe('g2');
      expect(sorted[2].id).toBe('g1');
    });

    it('should sort games by createdAt if dates are identical', () => {
      const games = [
        { id: 'g1', tournament: { date: new Date('2024-01-01') }, createdAt: new Date(200) },
        { id: 'g2', tournament: { date: new Date('2024-01-01') }, createdAt: new Date(100) },
      ];

      const sorted = sortGamesChronologically(games);
      expect(sorted[0].id).toBe('g2');
      expect(sorted[1].id).toBe('g1');
    });
  });

  describe('recalculateAllElos', () => {
    let mockPrisma: any;

    beforeEach(() => {
      vi.restoreAllMocks();
      mockPrisma = {
        player: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn().mockResolvedValue({}),
          findMany: vi.fn().mockResolvedValue([
            { id: 'p1', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
            { id: 'p2', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 }
          ]),
        },
        eloHistory: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 })
        },
        game: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'g2',
              tournament: { type: 'Einzel', date: new Date('2024-01-02') },
              createdAt: new Date(100),
              t1Player1Id: 'p1',
              t2Player1Id: 'p2',
              scores: [{ score1: 5, score2: 0 }],
            },
            {
              id: 'g1',
              tournament: { type: 'Einzel', date: new Date('2024-01-01') },
              createdAt: new Date(100),
              t1Player1Id: 'p1',
              t2Player1Id: 'p2',
              scores: [{ score1: 5, score2: 0 }],
            },
          ]),
        },
        $transaction: vi.fn((batch) => Promise.all(batch)),
      };
    });

    it('should process games in chronological order by creating history appropriately', async () => {
      await recalculateAllElos({ prisma: mockPrisma, log: false });

      // Check createMany was called with history elements in correct order
      const createManyMock = mockPrisma.eloHistory.createMany;
      expect(createManyMock).toHaveBeenCalled();

      const insertData = createManyMock.mock.calls[0][0].data;
      expect(insertData).toBeDefined();

      // Since it creates 2 records per game (team1 + team2), history has length 4
      expect(insertData.length).toBe(4);

      // Check first two records are for g1 (2024-01-01)
      expect(insertData[0].gameId).toBe('g1');
      expect(insertData[1].gameId).toBe('g1');

      // Check next two records are for g2 (2024-01-02)
      expect(insertData[2].gameId).toBe('g2');
      expect(insertData[3].gameId).toBe('g2');
    });
  });
});
