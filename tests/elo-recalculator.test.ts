import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sortGamesChronologically, parseDate, recalculateAllElos } from '../src/data-parser/elo-recalculator.js';
import * as eloTransaction from '../src/server/elo-transaction.js';

describe('elo-recalculator', () => {
  describe('parseDate', () => {
    it('should parse DD.MM.YYYY correctly', () => {
      const ts = parseDate('01.02.2024');
      const date = new Date(ts);
      expect(date.getUTCFullYear()).toBe(2024);
      // Note: new Date("2024-02-01") depends on local timezone, 
      // but parseDate uses string template which should be stable.
      expect(date.getMonth()).toBe(1); // February
      expect(date.getDate()).toBe(1);
    });
  });

  describe('sortGamesChronologically', () => {
    it('should sort games by tournament date', () => {
      const games = [
        { id: 'g1', tournament: { date: '02.01.2024' }, createdAt: new Date(100) },
        { id: 'g2', tournament: { date: '01.01.2024' }, createdAt: new Date(200) },
        { id: 'g3', tournament: { date: '01.01.2023' }, createdAt: new Date(300) },
      ];

      const sorted = sortGamesChronologically(games);
      expect(sorted[0].id).toBe('g3');
      expect(sorted[1].id).toBe('g2');
      expect(sorted[2].id).toBe('g1');
    });

    it('should sort games by createdAt if dates are identical', () => {
      const games = [
        { id: 'g1', tournament: { date: '01.01.2024' }, createdAt: new Date(200) },
        { id: 'g2', tournament: { date: '01.01.2024' }, createdAt: new Date(100) },
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
        },
        eloHistory: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        game: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'g2',
              tournament: { type: 'Single', date: '02.01.2024' },
              createdAt: new Date(100),
              t1Player1Id: 'p1',
              t2Player1Id: 'p2',
              scores: [{ score1: 5, score2: 0 }],
            },
            {
              id: 'g1',
              tournament: { type: 'Single', date: '01.01.2024' },
              createdAt: new Date(100),
              t1Player1Id: 'p1',
              t2Player1Id: 'p2',
              scores: [{ score1: 5, score2: 0 }],
            },
          ]),
        },
        $transaction: vi.fn((cb) => cb(mockPrisma)),
      };
    });

    it('should process games in chronological order', async () => {
      const spy = vi.spyOn(eloTransaction, 'updateEloForExistingGame').mockResolvedValue({} as any);

      await recalculateAllElos({ prisma: mockPrisma, log: false });

      expect(spy).toHaveBeenCalledTimes(2);
      // Check first call is g1 (2024-01-01)
      expect(spy.mock.calls[0][0].gameId).toBe('g1');
      // Check second call is g2 (2024-01-02)
      expect(spy.mock.calls[1][0].gameId).toBe('g2');
    });
  });
});
