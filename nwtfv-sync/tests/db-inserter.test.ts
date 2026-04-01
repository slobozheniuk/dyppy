import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensurePlayer, seedTournament, createSeedContext, SeedContext } from '../src/data-parser/db-inserter.js';
import { Tournament } from '../src/data-parser/tournaments.js';

describe('db-inserter', () => {
  let mockPrisma: any;
  let ctx: SeedContext;

  beforeEach(() => {
    mockPrisma = {
      player: {
        findUnique: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 'new-player-id' }),
      },
      tournament: {
        findUnique: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 'new-tournament-id' }),
        delete: vi.fn(),
      },
      round: {
        create: vi.fn().mockResolvedValue({ id: 'new-round-id' }),
      },
      placement: {
        create: vi.fn(),
      },
      division: {
        create: vi.fn().mockResolvedValue({ id: 'new-division-id' }),
      },
      gameStage: {
        create: vi.fn().mockResolvedValue({ id: 'new-stage-id' }),
      },
      game: {
        create: vi.fn(),
      },
    };

    ctx = createSeedContext({
      prisma: mockPrisma,
      getPlayerDetails: vi.fn().mockResolvedValue({
        id: 123,
        name: 'John',
        surname: 'Doe',
        category: 'H',
        clubs: [],
        organisations: [],
        nationalNumber: '123',
        rankings: [],
      }),
      log: false,
    });
  });

  describe('ensurePlayer', () => {
    it('should return cached player id if available by nwtfvId', async () => {
      ctx.playerIdCache.set(123, 'cached-id');
      const id = await ensurePlayer(ctx, { name: 'John Doe', nwtfvId: 123 });
      expect(id).toBe('cached-id');
      expect(mockPrisma.player.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch and create player if not in cache or DB', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);
      const id = await ensurePlayer(ctx, { name: 'John Doe', nwtfvId: 123 });
      
      expect(id).toBe('new-player-id');
      expect(mockPrisma.player.create).toHaveBeenCalled();
      expect(ctx.playerIdCache.get(123)).toBe('new-player-id');
    });

    it('should create skeleton if no nwtfvId is provided', async () => {
      mockPrisma.player.findUnique.mockResolvedValue(null);
      const id = await ensurePlayer(ctx, { name: 'Unknown Player' });
      
      expect(id).toBe('new-player-id');
      expect(mockPrisma.player.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: 'Unknown Player',
          surname: 'Unknown Player',
        })
      }));
    });
  });

  describe('seedTournament', () => {
    const mockTournament: Tournament = {
      id: 500,
      tournamentGroupID: 1,
      name: 'Test Tournament',
      type: 'Offenes Doppel',
      date: new Date('2024-01-01'),
      place: 'Gronau',
      mainRound: {
        finalPlacements: [],
        divisions: [],
      },
    };

    it('should skip if tournament already exists and force is false', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: 'existing-id' });
      await seedTournament(ctx, mockTournament);
      expect(mockPrisma.tournament.create).not.toHaveBeenCalled();
    });

    it('should delete and re-create if force is true', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: 'existing-id' });
      await seedTournament(ctx, mockTournament, { force: true });
      expect(mockPrisma.tournament.delete).toHaveBeenCalled();
      expect(mockPrisma.tournament.create).toHaveBeenCalled();
    });

    it('should create tournament and rounds', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue(null);
      await seedTournament(ctx, mockTournament);
      
      expect(mockPrisma.tournament.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          nwtfvId: 500,
          name: 'Test Tournament',
        })
      }));
      expect(mockPrisma.round.create).toHaveBeenCalled();
    });
  });
});
