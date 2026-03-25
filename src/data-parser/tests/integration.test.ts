import { test, expect } from 'vitest';
import { getTournamentDetails } from '../tournaments.ts';

test('correctly parses OD tournament 6382 without scores', async () => {
    // Note: this test requires network access to the designated tournament ID
    const data = await getTournamentDetails(6382);

    expect(data).toBeDefined();
    // Check first item based on example-tournaments.html
    expect(data.id).toBe(6382);
    expect(data.date).toBe('20.03.2026');
    expect(data.name).toBe('Mini - Challenger');
    expect(data.type).toBe('Offenes Doppel');
    expect(data.place).toBe('Oberhausen');
    expect(data.numberOfParticipants).toBe(25);
    expect(data.qualifyingRound!.finalPlacements).toHaveLength(25);
    expect(data.mainRound.finalPlacements).toHaveLength(25);

    const firstQual = data.qualifyingRound?.finalPlacements[0];
    expect(firstQual?.rank).toBe(1);
    expect(firstQual?.competitor.type).toBe('team');
    if (firstQual?.competitor.type === 'team') {
        expect(firstQual.competitor.player1.name).toBe('Röttger, Nico');
        expect(firstQual.competitor.player1.nwtfvId).toBe(7896);
        expect(firstQual.competitor.player2.name).toBe('Schmidt, Andreas');
        expect(firstQual.competitor.player2.nwtfvId).toBe(9051);
    }

    const twentyMain = data.mainRound.finalPlacements[19];
    expect(twentyMain.rank).toBe(20);
    expect(twentyMain.competitor.type).toBe('team');
    if (twentyMain.competitor.type === 'team') {
        expect(twentyMain.competitor.player1.name).toBe('Busch, André');
        expect(twentyMain.competitor.player1.nwtfvId).toBe(8063);
        expect(twentyMain.competitor.player2.name).toBe('König, Kyrill');
        expect(twentyMain.competitor.player2.nwtfvId).toBe(8125);
    }
});

test('correcly parses tournament players for OS tournament without scores', async () => {
    const data = await getTournamentDetails(6371);

    expect(data.id).toBe(6371);
    expect(data.date).toBe('25.02.2026');
    expect(data.name).toBe('Mini Challenger');
    expect(data.type).toBe('Offenes Einzel');
    expect(data.place).toBe('Minden');
    expect(data.numberOfParticipants).toBe(13);
    expect(data.qualifyingRound!.finalPlacements).toHaveLength(13);
    expect(data.mainRound.finalPlacements).toHaveLength(13);

    const firstQual = data.qualifyingRound?.finalPlacements[0];
    expect(firstQual?.rank).toBe(1);
    expect(firstQual?.competitor.type).toBe('player');
    if (firstQual?.competitor.type === 'player') {
        expect(firstQual.competitor.player.name).toBe('Olfert, Viktor');
        expect(firstQual.competitor.player.nwtfvId).toBe(8754);
    }

    const fourthMain = data.mainRound.finalPlacements[3];
    expect(fourthMain.rank).toBe(4);
    expect(fourthMain.competitor.type).toBe('player');
    if (fourthMain.competitor.type === 'player') {
        expect(fourthMain.competitor.player.name).toBe('Regener, Michael');
        expect(fourthMain.competitor.player.nwtfvId).toBeUndefined();
    }
});
