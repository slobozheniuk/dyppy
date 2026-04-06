import { test, expect } from 'vitest';
import { getPlayerDetails } from '../../src/fetch/players.ts';

test('correctly parses player 385 (Dieter Schürmann)', async () => {
    const player = await getPlayerDetails(385);

    expect(player).toBeDefined();
    expect(player.id).toBe(385);
    expect(player.name).toBe('Dieter');
    expect(player.surname).toBe('Schürmann');
    expect(player.category).toBe('S');
    expect(player.clubs).toContain('Kickerfreunde Coesfeld');
    expect(player.clubs).toContain('KKC Haltern am See e.V.');
    expect(player.nationalNumber).toBe('10-0457');
    expect(player.internationalNumber).toBe('27605366');

    expect(player.rankings).toBeDefined();
    expect(player.rankings.length).toBeGreaterThan(0);

    const herren2026 = player.rankings.find(r => r.name === 'Herren' && r.year === 2026);
    expect(herren2026).toBeDefined();
    expect(herren2026?.rank).toBeGreaterThan(0);
    expect(herren2026?.totalRankedPlayers).toBeGreaterThan(0);
});
