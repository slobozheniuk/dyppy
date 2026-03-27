// A mocked benchmark that does not require a real DB connection
import { performance } from 'perf_hooks';

// Mock DB data
const mockPlayers = {
  'p1': { id: 'p1', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
  'p2': { id: 'p2', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
  'p3': { id: 'p3', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
  'p4': { id: 'p4', singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
};

// Mock Prisma Client
const tx = {
  player: {
    findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
      // simulate network/db latency
      await new Promise(resolve => setTimeout(resolve, 2));
      const p = mockPlayers[where.id as keyof typeof mockPlayers];
      if (!p) throw new Error('Not found');
      return p;
    },
    findMany: async ({ where }: { where: { id: { in: string[] } } }) => {
      // simulate network/db latency slightly longer than a single query, but much less than N queries
      await new Promise(resolve => setTimeout(resolve, 3));
      return where.id.in.map(id => mockPlayers[id as keyof typeof mockPlayers]).filter(Boolean);
    }
  }
};

async function runBenchmark() {
  const team1Ids = ['p1', 'p2'];
  const team2Ids = ['p3', 'p4'];
  const iterations = 50;

  // Benchmark 1: N queries
  let timeNQueries = 0;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const fetchPlayer = async (id: string) => {
      const p = await tx.player.findUniqueOrThrow({ where: { id } });
      return {
        id: p.id,
        ratings: { singleElo: p.singleElo, doubleElo: p.doubleElo, dypElo: p.dypElo, totalElo: p.totalElo },
      };
    };

    const team1 = await Promise.all(team1Ids.map(fetchPlayer));
    const team2 = await Promise.all(team2Ids.map(fetchPlayer));

    const end = performance.now();
    timeNQueries += (end - start);
  }

  // Benchmark 2: 1 query
  let time1Query = 0;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    const allPlayerIds = [...team1Ids, ...team2Ids];
    const players = await tx.player.findMany({
      where: { id: { in: allPlayerIds } },
    });

    if (players.length !== allPlayerIds.length) {
      throw new Error(`Expected ${allPlayerIds.length} players, but found ${players.length}`);
    }

    const playerMap = new Map(players.map(p => [
      p.id,
      {
        id: p.id,
        ratings: { singleElo: p.singleElo, doubleElo: p.doubleElo, dypElo: p.dypElo, totalElo: p.totalElo },
      }
    ]));

    const team1 = team1Ids.map(id => playerMap.get(id)!);
    const team2 = team2Ids.map(id => playerMap.get(id)!);

    const end = performance.now();
    time1Query += (end - start);
  }

  console.log(`\n--- MOCKED BENCHMARK RESULTS (${iterations} iterations) ---`);
  console.log(`Simulated DB latency: 2ms per query (N queries), 3ms per query (1 query)`);
  console.log(`N Queries Approach: ${timeNQueries.toFixed(2)} ms`);
  console.log(`1 Query Approach:   ${time1Query.toFixed(2)} ms`);
  console.log(`Improvement:        ${(timeNQueries / time1Query).toFixed(2)}x faster`);
}

runBenchmark().catch(console.error);
