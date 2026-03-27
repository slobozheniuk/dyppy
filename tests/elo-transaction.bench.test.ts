import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as eloTransaction from '../src/server/elo-transaction.js';
import { updateEloForExistingGame } from '../src/server/elo-transaction.js';

describe('elo-transaction benchmark', () => {
  let mockPrisma: any;
  let playerDb: Record<string, any>;
  let historyDb: any[];

  beforeEach(() => {
    vi.restoreAllMocks();

    playerDb = {
      'p1': { id: 'p1', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
      'p2': { id: 'p2', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
      'p3': { id: 'p3', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
      'p4': { id: 'p4', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
    };
    historyDb = [];

    mockPrisma = {
      player: {
        findUniqueOrThrow: vi.fn().mockImplementation(async ({ where }) => {
          return playerDb[where.id];
        }),
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return where.id.in.map(id => playerDb[id]).filter(Boolean);
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          playerDb[where.id] = { ...playerDb[where.id], ...data };
          return playerDb[where.id];
        }),
      },
      eloHistory: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          historyDb.push(data);
          return data;
        }),
        createMany: vi.fn().mockImplementation(async ({ data }) => {
          historyDb.push(...data);
          return { count: data.length };
        }),
      },
      $transaction: vi.fn(async (cb) => {
        return await cb(mockPrisma);
      }),
    };
  });

  it('benchmark processGameElo', async () => {
    const NUM_ITERATIONS = 500;
    const start = performance.now();

    for (let i = 0; i < NUM_ITERATIONS; i++) {
      await updateEloForExistingGame({
        gameId: `g${i}`,
        t1Player1Id: 'p1',
        t1Player2Id: 'p2',
        t2Player1Id: 'p3',
        t2Player2Id: 'p4',
        scores: [{ score1: 5, score2: 3 }],
        tournamentType: 'Offenes Doppel',
        gameDate: new Date(),
      }, mockPrisma);
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`\n--- Benchmark Results ---`);
    console.log(`Processed ${NUM_ITERATIONS} games in ${duration.toFixed(2)}ms`);
    console.log(`Average: ${(duration / NUM_ITERATIONS).toFixed(3)}ms per game`);
    console.log(`EloHistory records created: ${historyDb.length}`);

    expect(historyDb.length).toBe(NUM_ITERATIONS * 4); // 4 players per game
  });
});
