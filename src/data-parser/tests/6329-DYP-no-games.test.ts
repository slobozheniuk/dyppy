import { test, expect } from 'vitest';
import { getTournamentDetails } from '../tournaments.ts';

test('correctly parses Monster DYP tournament 6329', async () => {
    const data = await getTournamentDetails(6329);

    expect(data).toBeDefined();
    expect(data.id).toBe(6329);
    expect(data.date).toBe('24.03.2026');
    expect(data.name).toBe('Mini - Challenger');
    expect(data.type).toBe('Monster DYP');
    expect(data.place).toBe('Aachen');
    expect(data.numberOfParticipants).toBe(27);

    expect(data.qualifyingRound).toBeUndefined();
    expect(data.mainRound.finalPlacements).toHaveLength(27);

    const firstPlace = data.mainRound.finalPlacements[0];
    expect(firstPlace.rank).toBe(1);
    expect(firstPlace.competitor.type).toBe('player');
    if (firstPlace.competitor.type === 'player') {
        expect(firstPlace.competitor.player.name).toBe('Kiss-Toth, Laszlo');
        expect(firstPlace.competitor.player.nwtfvId).toBe(8323);
    }

    const ninthPlace = data.mainRound.finalPlacements[8];
    expect(ninthPlace.rank).toBe(9);
    expect(ninthPlace.competitor.type).toBe('player');
    if (ninthPlace.competitor.type === 'player') {
        expect(ninthPlace.competitor.player.name).toBe('Nollgen, Martin');
        expect(ninthPlace.competitor.player.nwtfvId).toBeUndefined();
    }

    const twentySeventhPlace = data.mainRound.finalPlacements[26];
    expect(twentySeventhPlace.rank).toBe(27);
    expect(twentySeventhPlace.competitor.type).toBe('player');
    if (twentySeventhPlace.competitor.type === 'player') {
        expect(twentySeventhPlace.competitor.player.name).toBe('Welter, Johannes');
        expect(twentySeventhPlace.competitor.player.nwtfvId).toBe(8815);
    }

    expect(data.mainRound.divisions).toHaveLength(1);

    const mainPro = data.mainRound.divisions[0];
    expect(mainPro.skillLevel).toBe('Pro');
    expect(mainPro.gameStages).toHaveLength(9);
    expect(mainPro.gameStages[0].name).toBe('1. Runde');
    expect(mainPro.gameStages[8].name).toBe('9. Runde');
    
    // In this specific tournament, games list inside stages are empty
    expect(mainPro.gameStages[0].games).toHaveLength(0);
});
