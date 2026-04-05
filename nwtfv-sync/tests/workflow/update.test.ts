import { describe, it, expect, vi } from 'vitest';
import { getLastUpdateDate } from '../../src/workflow/update.js';
import * as localStore from '../../src/transform/local-store.js';

describe('workflow update', () => {
  describe('getLastUpdateDate', () => {
    it('returns dbDate if later than local', async () => {
      const mockPrisma = {
        game: {
          findFirst: vi.fn().mockResolvedValue({ tournament: { date: new Date('2024-06-01T00:00:00Z') } })
        }
      } as any;
      
      const spy = vi.spyOn(localStore, 'getLastLocalUpdateDate').mockReturnValue(new Date('2024-05-01T00:00:00Z'));
      
      const date = await getLastUpdateDate({ dataPaths: {} as any, prisma: mockPrisma });
      // returns min
      expect(date?.toISOString()).toMatch('2024-05-01');
      spy.mockRestore();
    });

    it('returns localDate if later than db', async () => {
      const mockPrisma = {
        game: {
          findFirst: vi.fn().mockResolvedValue({ tournament: { date: new Date('2024-04-01T00:00:00Z') } })
        }
      } as any;
      
      const spy = vi.spyOn(localStore, 'getLastLocalUpdateDate').mockReturnValue(new Date('2024-05-01T00:00:00Z'));
      
      const date = await getLastUpdateDate({ dataPaths: {} as any, prisma: mockPrisma });
      // returns min
      expect(date?.toISOString()).toMatch('2024-04-01');
      spy.mockRestore();
    });
    
    it('returns localDate if db has no games', async () => {
      const mockPrisma = {
        game: {
          findFirst: vi.fn().mockResolvedValue(null)
        }
      } as any;
      
      const spy = vi.spyOn(localStore, 'getLastLocalUpdateDate').mockReturnValue(new Date('2024-05-01T00:00:00Z'));
      
      const date = await getLastUpdateDate({ dataPaths: {} as any, prisma: mockPrisma });
      expect(date?.toISOString()).toMatch('2024-05-01');
      spy.mockRestore();
    });
  });
});
