import { test, expect } from 'vitest';
import { getTournaments } from '../../src/data-parser/tournaments.ts';

test('getTournaments return correct tournaments with tournamentIds and year filters', async () => {
    const data = await getTournaments({ tournamentIds: [4394], year: [2025] });
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(5345);
    expect(data[0].tournamentGroupID).toBe(4394);
});

test('getTournaments correctly combines data from several years', { timeout: 60000 }, async () => {
    const dataFrom2025 = await getTournaments({ year: [2025], withoutDetails: true });
    const dataFrom2026 = await getTournaments({ year: [2026], withoutDetails: true });
    const dataFrom2025And2026 = await getTournaments({ year: [2025, 2026], withoutDetails: true });
    expect(dataFrom2025And2026).toHaveLength(dataFrom2025.length + dataFrom2026.length);
});

test('getTournaments returns tournaments for current year by default', async () => {
    const data = await getTournaments({ limit: 1 });
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].date.getFullYear()).toBe(new Date().getFullYear());
});