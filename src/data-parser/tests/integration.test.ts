import { test, expect } from 'vitest';
import { getTournamentDetails, getTournaments } from '../tournaments.ts';

test('parseTournaments correctly parses main tournament list', async () => {
    const data = await getTournamentDetails(5345);

    expect(data).toBeDefined();
    // Check first item based on example-tournaments.html
    expect(data.id).toBe(5345);
    expect(data.date).toBe('14.02.2025');
    expect(data.name).toBe('Mini - Challenger');
    expect(data.type).toBe('Offenes Doppel');
    expect(data.place).toBe('Haltern am See');
    expect(data.numberOfParticipants).toBe(21);
    expect(data.qualifyingRound!.finalPlacements).toHaveLength(21);
    expect(data.mainRound.finalPlacements).toHaveLength(21);
    expect(data.qualifyingRound?.finalPlacements[0].rank).toBe(1);
    const firstQual = data.qualifyingRound?.finalPlacements[0];
    expect(firstQual?.competitor.type).toBe('team');
    if (firstQual?.competitor.type === 'team') {
        expect(firstQual.competitor.player1.name).toBe('Truchel, Frank');
        expect(firstQual.competitor.player1.id).toBe(431);
        expect(firstQual.competitor.player2.name).toBe('Lauterfeld, Rainer');
        expect(firstQual.competitor.player2.id).toBe(237);
    }

    const twentyMain = data.mainRound.finalPlacements[19];
    expect(twentyMain.rank).toBe(20);
    expect(twentyMain.competitor.type).toBe('team');
    if (twentyMain.competitor.type === 'team') {
        expect(twentyMain.competitor.player1.name).toBe('Siek, Carsten');
        expect(twentyMain.competitor.player1.id).toBeUndefined();
        expect(twentyMain.competitor.player2.name).toBe('Müller, Sascha');
        expect(twentyMain.competitor.player2.id).toBe(7889);
    }
});

test('correcly parses tournament players for OD tournament without scores', async () => {
    // Note: this test requires network access to the designated tournament ID
    const detailsId = 6382;
    const data = await getTournamentDetails(detailsId);

    expect(data.mainRound.finalPlacements.length).toBeGreaterThanOrEqual(8);
    expect(data.qualifyingRound?.finalPlacements).toBeInstanceOf(Array);
    
    // Find 8th place
    const eighthPlace = data.mainRound.finalPlacements.find(p => p.rank === 8);
    expect(eighthPlace).toBeDefined();
    
    expect(data.numberOfParticipants).toBe(25);
    // Verify 8th place names
    expect(eighthPlace!.rank).toBe(8);
    if (eighthPlace!.competitor.type === 'team') {
        expect(eighthPlace!.competitor.player1.name).toBe('Niehuis, Felix');
        expect(eighthPlace!.competitor.player1.id).toBe(8033);
        expect(eighthPlace!.competitor.player2.name).toBe('Afentoulidis, Fabian');
        expect(eighthPlace!.competitor.player2.id).toBe(7427);
    } else {
        expect.fail('Eighth place should be a team');
    }
});

test('correcly parses tournament players for OD tournament with scores', async () => {
    // Note: this test requires network access to the designated tournament ID
    const detailsId = 6554;
    const data = await getTournamentDetails(detailsId);

    expect(data.mainRound.finalPlacements).toHaveLength(16);
    expect(data.qualifyingRound!.finalPlacements).toHaveLength(16);
    
    // Verify first preliminary place
    const firstPrelimPlace = data.qualifyingRound!.finalPlacements.find(p => p.rank === 1);
    expect(firstPrelimPlace).toBeDefined();
    expect(firstPrelimPlace!.rank).toBe(1);
    if (firstPrelimPlace!.competitor.type === 'team') {
        expect(firstPrelimPlace!.competitor.player1.name).toBe('van Dijk, Steven');
        expect(firstPrelimPlace!.competitor.player2.name).toBe('Seetsen, Menno');
    }
    
    // Find 1st place
    const firstPlace = data.mainRound.finalPlacements.find(p => p.rank === 1);
    expect(firstPlace).toBeDefined();
    
    expect(data.numberOfParticipants).toBe(16);
    // Verify 1st place names
    expect(firstPlace!.rank).toBe(1);
    if (firstPlace!.competitor.type === 'team') {
        expect(firstPlace!.competitor.player1.name).toBe('Li Pira, Claudio');
        expect(firstPlace!.competitor.player1.id).toBe(242);
        expect(firstPlace!.competitor.player2.name).toBe('Nolte, Lars');
        expect(firstPlace!.competitor.player2.id).toBe(290);
    }

    const secondPlace = data.mainRound.finalPlacements.find(p => p.rank === 2);
    expect(secondPlace).toBeDefined();
    expect(secondPlace!.rank).toBe(2);
    if (secondPlace!.competitor.type === 'team') {
        expect(secondPlace!.competitor.player1.name).toBe('van Dijk, Steven');
        expect(secondPlace!.competitor.player2.name).toBe('Seetsen, Menno');
    }

    const fourthPlace = data.mainRound.finalPlacements.find(p => p.rank === 4);
    expect(fourthPlace).toBeDefined();
    expect(fourthPlace!.rank).toBe(4);
    if (fourthPlace!.competitor.type === 'team') {
        expect(fourthPlace!.competitor.player1.name).toBe('Jansen, Danny');
        expect(fourthPlace!.competitor.player1.id).toBe(9000);
        expect(fourthPlace!.competitor.player2.name).toBe('Camp, Shem op den');
    }
});

test('correcly parses tournament players for OS tournament without scores', async () => {
    // Note: this test requires network access to the designated tournament ID
    const detailsId = 6371;
    const data = await getTournamentDetails(detailsId);

    expect(data.mainRound.finalPlacements).toHaveLength(13);
    expect(data.qualifyingRound!.finalPlacements).toHaveLength(13);
    
    // Verify first preliminary place
    const firstPrelimPlace = data.qualifyingRound!.finalPlacements.find(p => p.rank === 1);
    expect(firstPrelimPlace).toBeDefined();
    expect(firstPrelimPlace!.rank).toBe(1);
    if (firstPrelimPlace!.competitor.type === 'player') {
        expect(firstPrelimPlace!.competitor.player.name).toBe('Olfert, Viktor');
        expect(firstPrelimPlace!.competitor.player.id).toBe(8754);
    }
    
    // Find 1st place
    const firstPlace = data.mainRound.finalPlacements.find(p => p.rank === 1);
    expect(firstPlace).toBeDefined();
    
    expect(data.numberOfParticipants).toBe(13);
    // Verify 1st place names
    expect(firstPlace!.rank).toBe(1);
    if (firstPlace!.competitor.type === 'player') {
        expect(firstPlace!.competitor.player.name).toBe('Olfert, Viktor');
        expect(firstPlace!.competitor.player.id).toBe(8754);
    }
});
