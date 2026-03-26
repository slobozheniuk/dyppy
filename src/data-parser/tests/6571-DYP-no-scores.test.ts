import { test, expect } from 'vitest';
import { getTournamentDetails } from '../tournaments.ts';

test('correctly parses Monster DYP tournament 6571 without games', async () => {
    const data = await getTournamentDetails(6571);

    expect(data).toBeDefined();
    expect(data.id).toBe(6571);
    expect(data.date).toBe('12.03.2026');
    expect(data.name).toBe('Mini - Challenger');
    expect(data.type).toBe('Monster DYP');
    expect(data.place).toBe('Münster');
    expect(data.numberOfParticipants).toBe(25);

    expect(data.mainRound.finalPlacements).toHaveLength(25);
    expect(data.qualifyingRound!.finalPlacements).toHaveLength(25);

    const firstPlace = data.mainRound.finalPlacements[0];
    expect(firstPlace.rank).toBe(1);
    expect(firstPlace.competitor.type).toBe('player');
    if (firstPlace.competitor.type === 'player') {
        expect(firstPlace.competitor.player.name).toBe('Walter, Hendrik');
        expect(firstPlace.competitor.player.nwtfvId).toBe(454);
    }

    const lastPlace = data.mainRound.finalPlacements[24];
    expect(lastPlace.rank).toBe(25);
    expect(lastPlace.competitor.type).toBe('player');
    if (lastPlace.competitor.type === 'player') {
        expect(lastPlace.competitor.player.name).toBe('Bechtold, Emma');
        expect(lastPlace.competitor.player.nwtfvId).toBe(8950);
    }

    expect(data.mainRound.divisions).toHaveLength(1);
    const mainPro = data.mainRound.divisions[0];
    expect(mainPro.skillLevel).toBe('Pro');
    expect(mainPro.gameStages).toHaveLength(5);
    expect(mainPro.gameStages[0].name).toBe('Achtelfinale');
    expect(mainPro.gameStages[0].games).toHaveLength(0);

    expect(data.qualifyingRound!.divisions).toHaveLength(1);
    const qualOpen = data.qualifyingRound!.divisions[0];
    expect(qualOpen.skillLevel).toBe('Open');
    expect(qualOpen.gameStages).toHaveLength(5);
    expect(qualOpen.gameStages[0].name).toBe('1. Runde');
    expect(qualOpen.gameStages[0].games).toHaveLength(0);
});
