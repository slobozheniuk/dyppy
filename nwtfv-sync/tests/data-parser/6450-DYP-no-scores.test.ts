import { test, expect } from 'vitest';
import { getTournamentDetails } from '../../src/fetch/tournaments.ts';

test('correctly parses Monster DYP tournament 6450 without games', async () => {
    const data = await getTournamentDetails(6450);

    expect(data).toBeDefined();
    expect(data.id).toBe(6450);
    expect(data.date).toEqual(new Date(2026, 2, 19));
    expect(data.name).toBe('Mini - Challenger');
    expect(data.type).toBe('Monster DYP');
    expect(data.place).toBe('Gronau');
    expect(data.numberOfParticipants).toBe(13);

    expect(data.mainRound.finalPlacements).toHaveLength(13);
    expect(data.qualifyingRound).toBeUndefined();

    const firstPlace = data.mainRound.finalPlacements[0];
    expect(firstPlace.rank).toBe(1);
    expect(firstPlace.competitor.type).toBe('player');
    if (firstPlace.competitor.type === 'player') {
        expect(firstPlace.competitor.player.name).toBe('Heijmen, Mike');
        expect(firstPlace.competitor.player.nwtfvId).toBe(10036);
    }

    const fourthPlace = data.mainRound.finalPlacements[3];
    expect(fourthPlace.rank).toBe(4);
    expect(fourthPlace.competitor.type).toBe('player');
    if (fourthPlace.competitor.type === 'player') {
        expect(fourthPlace.competitor.player.name).toBe('Demir, Faulus');
        expect(fourthPlace.competitor.player.nwtfvId).toBeUndefined();
    }

    const lastPlace = data.mainRound.finalPlacements[12];
    expect(lastPlace.rank).toBe(13);
    expect(lastPlace.competitor.type).toBe('player');
    if (lastPlace.competitor.type === 'player') {
        expect(lastPlace.competitor.player.name).toBe('Leusing, Tobias');
        expect(lastPlace.competitor.player.nwtfvId).toBeUndefined();
    }

    expect(data.mainRound.divisions).toHaveLength(0);
});
