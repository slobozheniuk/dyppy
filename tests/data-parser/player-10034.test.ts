import { test, expect } from 'vitest';
import { getPlayerDetails } from '../../src/data-parser/players.ts';

test('correctly parses player 10034 (Evgenii Slobozheniuk)', async () => {
    const player = await getPlayerDetails(10034);

    expect(player).toBeDefined();
    expect(player.id).toBe(10034);
    expect(player.name).toBe('Evgenii');
    expect(player.surname).toBe('Slobozheniuk');
    expect(player.category).toBe('H');
    expect(player.clubs).toContain('Kickerclub Gronau e.V.');
    expect(player.organisations).toContain('Nordrhein-Westfalen');
    expect(player.nationalNumber).toBe('10-2840');

    expect(player.rankings).toBeDefined();
    expect(player.rankings.length).toBeGreaterThan(0);

    const herren2026 = player.rankings.find(r => r.name === 'Herren' && r.year === 2026);
    expect(herren2026).toBeDefined();
    expect(herren2026?.rank).toBeGreaterThan(0);
    expect(herren2026?.totalRankedPlayers).toBeGreaterThan(0);
});
