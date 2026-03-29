
import { vi } from 'vitest';
import { seedTournament, createSeedContext } from '../src/data-parser/db-inserter.js';
import { Tournament } from '../src/data-parser/tournaments.js';

async function runBaseline() {
  const callCounts: Record<string, number> = {
    'placement.create': 0,
    'game.create': 0,
    'placement.createMany': 0,
    'game.createMany': 0,
  };

  const mockPrisma: any = {
    player: {
      findUnique: vi.fn().mockResolvedValue({ id: 'p-id' }),
      create: vi.fn().mockResolvedValue({ id: 'p-id' }),
    },
    tournament: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 't-id' }),
    },
    round: {
      create: vi.fn().mockResolvedValue({ id: 'r-id' }),
    },
    placement: {
      create: vi.fn(() => { callCounts['placement.create']++; return Promise.resolve({}); }),
      createMany: vi.fn(() => { callCounts['placement.createMany']++; return Promise.resolve({}); }),
    },
    division: {
      create: vi.fn().mockResolvedValue({ id: 'd-id' }),
    },
    gameStage: {
      create: vi.fn().mockResolvedValue({ id: 's-id' }),
    },
    game: {
      create: vi.fn(() => { callCounts['game.create']++; return Promise.resolve({}); }),
      createMany: vi.fn(() => { callCounts['game.createMany']++; return Promise.resolve({}); }),
    },
  };

  const ctx = createSeedContext({
    prisma: mockPrisma,
    getPlayerDetails: vi.fn().mockResolvedValue({ id: 1, name: 'P', surname: '1', rankings: [] }),
    log: false,
  });

  const mockTournament: Tournament = {
    id: 1,
    tournamentGroupID: 1,
    name: 'T',
    type: 'D',
    date: 'D',
    place: 'P',
    mainRound: {
      finalPlacements: Array(10).fill({ rank: 1, competitor: { type: 'player', player: { name: 'P1', nwtfvId: 1 } } }),
      divisions: [
        {
          skillLevel: 'Open',
          gameStages: [
            {
              name: 'S1',
              games: Array(10).fill({
                competitor1: { type: 'player', player: { name: 'P1', nwtfvId: 1 } },
                competitor2: { type: 'player', player: { name: 'P2', nwtfvId: 2 } },
                scores: [{ score1: 5, score2: 0 }]
              })
            }
          ]
        }
      ],
    },
  };

  await seedTournament(ctx, mockTournament);

  console.log('--- Baseline Stats ---');
  console.log(JSON.stringify(callCounts, null, 2));
}

runBaseline().catch(console.error);
