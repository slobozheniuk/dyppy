import { recalculateAllElos } from './src/data-parser/elo-recalculator.js';
import { performance } from 'perf_hooks';

// We'll mock the Prisma Client to simulate slow DB operations
const simulateLatency = () => new Promise(resolve => setTimeout(resolve, 1)); // 1ms network latency per query

const mockPrisma = {
  player: {
    updateMany: async () => { await simulateLatency(); return { count: 0 }; },
    findUniqueOrThrow: async ({ where }: any) => {
      await simulateLatency();
      return mockPlayers.find(p => p.id === where.id);
    },
    update: async ({ where, data }: any) => {
      await simulateLatency();
      const p = mockPlayers.find(p => p.id === where.id);
      if (p) {
        Object.assign(p, data);
      }
      return p;
    },
    findMany: async () => {
      await simulateLatency();
      return mockPlayers;
    },
  },
  eloHistory: {
    deleteMany: async () => { await simulateLatency(); return { count: 0 }; },
    create: async () => { await simulateLatency(); return {}; },
    createMany: async () => { await simulateLatency(); return {}; },
  },
  game: {
    findMany: async () => {
      await simulateLatency();
      return mockGames;
    },
  },
  $transaction: async (operations: any) => {
    // If operations is a function, call it with mockPrisma
    if (typeof operations === 'function') {
      return operations(mockPrisma);
    }
    // If it's an array of promises, await all
    if (Array.isArray(operations)) {
      return Promise.all(operations);
    }
  }
};

const mockPlayers = Array.from({ length: 100 }).map((_, i) => ({
  id: `p${i}`,
  singleElo: 1500,
  doubleElo: 1500,
  dypElo: 1500,
  totalElo: 1500
}));

const mockGames = Array.from({ length: 500 }).map((_, i) => {
  const p1 = `p${Math.floor(Math.random() * 100)}`;
  const p2 = `p${Math.floor(Math.random() * 100)}`;

  return {
    id: `g${i}`,
    t1Player1Id: p1,
    t2Player1Id: p2,
    scores: [{ score1: 5, score2: 3 }],
    tournament: {
      type: "Einzel",
      date: `01.01.2024`
    },
    createdAt: new Date()
  };
});

async function run() {
  console.log('Running Baseline Benchmark...');
  const start = performance.now();
  await recalculateAllElos({ prisma: mockPrisma, log: false });
  const end = performance.now();
  console.log(`Baseline time: ${(end - start).toFixed(2)} ms`);
}

run();
