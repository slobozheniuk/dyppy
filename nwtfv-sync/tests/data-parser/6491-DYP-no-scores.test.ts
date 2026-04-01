import { test, expect } from 'vitest';
import { getTournamentDetails } from '../../src/data-parser/tournaments.ts';

test('correctly parses Monster DYP tournament 6491', async () => {
    const data = await getTournamentDetails(6491);

    expect(data).toBeDefined();
    expect(data.id).toBe(6491);
    expect(data.date).toEqual(new Date(2026, 2, 23));
    expect(data.name).toBe('Mini - Challenger');
    expect(data.type).toBe('Monster DYP');
    expect(data.place).toBe('Soest');
    expect(data.numberOfParticipants).toBe(10);

    expect(data.mainRound.finalPlacements).toHaveLength(10);
    expect(data.qualifyingRound).toBeUndefined();

    const firstPlace = data.mainRound.finalPlacements[0];
    expect(firstPlace.rank).toBe(1);
    expect(firstPlace.competitor.type).toBe('player');
    if (firstPlace.competitor.type === 'player') {
        expect(firstPlace.competitor.player.name).toBe('Schlüter, Jens');
        expect(firstPlace.competitor.player.nwtfvId).toBe(9858);
    }

    const lastPlace = data.mainRound.finalPlacements[9];
    expect(lastPlace.rank).toBe(10);
    expect(lastPlace.competitor.type).toBe('player');
    if (lastPlace.competitor.type === 'player') {
        expect(lastPlace.competitor.player.name).toBe('Hustadt, Christian');
        expect(lastPlace.competitor.player.nwtfvId).toBe(9857);
    }

    expect(data.mainRound.divisions).toHaveLength(1);
    const mainPro = data.mainRound.divisions[0];
    expect(mainPro.skillLevel).toBe('Pro');
    expect(mainPro.gameStages).toHaveLength(14);
    expect(mainPro.gameStages[0].name).toBe('1. Runde');
    expect(mainPro.gameStages[13].name).toBe('14. Runde');
    expect(mainPro.gameStages[0].games).toHaveLength(0);
});
