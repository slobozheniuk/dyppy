import { test, expect } from 'vitest';
import { getPlayerDetails } from '../../src/fetch/players.ts';

test('correctly parses player 10087 (Maricel Borowski)', async () => {
    const player = await getPlayerDetails(10087);

    expect(player).toBeDefined();
    expect(player.id).toBe(10087);
    expect(player.name).toBe('Maricel');
    expect(player.surname).toBe('Borowski');
    expect(player.category).toBe('D');
    expect(player.clubs).toContain('Kickerfreunde Coesfeld');
    expect(player.organisations).toContain('Nordrhein-Westfalen');
    expect(player.nationalNumber).toBe('10-2885');
    expect(player.internationalNumber).toBeUndefined();

    expect(player.rankings).toBeDefined();
    expect(player.rankings.length).toBeGreaterThan(0);

    const damen2026 = player.rankings.find(r => r.name === 'Damen' && r.year === 2026);
    expect(damen2026).toBeDefined();
    expect(damen2026?.rank).toBeGreaterThan(0)
    expect(damen2026?.totalRankedPlayers).toBeGreaterThan(0);
});
