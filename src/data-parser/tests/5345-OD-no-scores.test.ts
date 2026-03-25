import { test, expect } from 'vitest';
import { getTournamentDetails } from '../tournaments.ts';

test('correctly parses OD tournament 5345 without scores', async () => {
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
    const firstQual = data.qualifyingRound?.finalPlacements[0];
    expect(firstQual?.rank).toBe(1);
    expect(firstQual?.competitor.type).toBe('team');
    if (firstQual?.competitor.type === 'team') {
        expect(firstQual.competitor.player1.name).toBe('Truchel, Frank');
        expect(firstQual.competitor.player1.nwtfvId).toBe(431);
        expect(firstQual.competitor.player2.name).toBe('Lauterfeld, Rainer');
        expect(firstQual.competitor.player2.nwtfvId).toBe(237);
    }

    const twentyMain = data.mainRound.finalPlacements[19];
    expect(twentyMain.rank).toBe(20);
    expect(twentyMain.competitor.type).toBe('team');
    if (twentyMain.competitor.type === 'team') {
        expect(twentyMain.competitor.player1.name).toBe('Siek, Carsten');
        expect(twentyMain.competitor.player1.nwtfvId).toBeUndefined();
        expect(twentyMain.competitor.player2.name).toBe('Müller, Sascha');
        expect(twentyMain.competitor.player2.nwtfvId).toBe(7889);
    }

    expect(data.qualifyingRound?.divisions).toHaveLength(1);
    expect(data.mainRound.divisions).toHaveLength(2);

    const qualifyingAll = data.qualifyingRound!.divisions[0];
    expect(qualifyingAll!.skillLevel).toBe('Open');
    const qualifyingStages = qualifyingAll!.gameStages;
    expect(qualifyingStages).toHaveLength(6);
    expect(qualifyingStages[0].name).toBe('1. Runde');
    expect(qualifyingStages[0].games).toHaveLength(10);
    expect(qualifyingStages[0].games[0].competitor1.type).toBe('team');
    expect(qualifyingStages[0].games[0].competitor2.type).toBe('team');
    expect(qualifyingStages[0].games[0].scores).toHaveLength(1);
    expect(qualifyingStages[0].games[0].scores[0].score1).toBe(1);
    expect(qualifyingStages[0].games[0].scores[0].score2).toBe(0);
    if (qualifyingStages[0].games[0].competitor1.type === 'team') {
        expect(qualifyingStages[0].games[0].competitor1.player1.name).toBe('Rascho, Faruk');
        expect(qualifyingStages[0].games[0].competitor1.player1.nwtfvId).toBe(8774);
        expect(qualifyingStages[0].games[0].competitor1.player2.name).toBe('Rascho, Aylin');
        expect(qualifyingStages[0].games[0].competitor1.player2.nwtfvId).toBe(8777);
    }
    if (qualifyingStages[0].games[0].competitor2.type === 'team') {
        expect(qualifyingStages[0].games[0].competitor2.player1.name).toBe('Hartmann, Julius');
        expect(qualifyingStages[0].games[0].competitor2.player1.nwtfvId).toBe(8692);
        expect(qualifyingStages[0].games[0].competitor2.player2.name).toBe('Rascho, Leyal');
        expect(qualifyingStages[0].games[0].competitor2.player2.nwtfvId).toBe(8776);
    }

    const mainAmateur = data.mainRound.divisions.find((division) => division.skillLevel === 'Amateur');
    expect(mainAmateur).toBeDefined();
    expect(mainAmateur?.skillLevel).toBe('Amateur');
    expect(mainAmateur?.gameStages).toHaveLength(5);
    expect(mainAmateur?.gameStages[0].name).toBe('Achtelfinale');
    expect(mainAmateur?.gameStages[1].name).toBe('Viertelfinale');
    expect(mainAmateur?.gameStages[2].name).toBe('Halbfinale');
    expect(mainAmateur?.gameStages[3].name).toBe('Platz 3');
    expect(mainAmateur?.gameStages[4].name).toBe('Finale');

    expect(mainAmateur?.gameStages[0].games).toHaveLength(4);
    expect(mainAmateur?.gameStages[1].games).toHaveLength(4);
    expect(mainAmateur?.gameStages[2].games).toHaveLength(2);
    expect(mainAmateur?.gameStages[3].games).toHaveLength(1);
    expect(mainAmateur?.gameStages[4].games).toHaveLength(1);

    expect(mainAmateur?.gameStages[1].games[0].competitor1.type).toBe('team');
    expect(mainAmateur?.gameStages[1].games[0].competitor2.type).toBe('team');
    expect(mainAmateur?.gameStages[1].games[0].scores).toHaveLength(1);
    expect(mainAmateur?.gameStages[1].games[0].scores[0].score1).toBe(1);
    expect(mainAmateur?.gameStages[1].games[0].scores[0].score2).toBe(0);
    if (mainAmateur?.gameStages[1].games[0].competitor1.type === 'team') {
        expect(mainAmateur?.gameStages[1].games[0].competitor1.player1.name).toBe('Symanek, Jochen');
        expect(mainAmateur?.gameStages[1].games[0].competitor1.player1.nwtfvId).toBe(8310);
        expect(mainAmateur?.gameStages[1].games[0].competitor1.player2.name).toBe('Redemann, Guido');
        expect(mainAmateur?.gameStages[1].games[0].competitor1.player2.nwtfvId).toBe(8276);
    }
    if (mainAmateur?.gameStages[1].games[0].competitor2.type === 'team') {
        expect(mainAmateur?.gameStages[1].games[0].competitor2.player1.name).toBe('Rascho, Faruk');
        expect(mainAmateur?.gameStages[1].games[0].competitor2.player1.nwtfvId).toBe(8774);
        expect(mainAmateur?.gameStages[1].games[0].competitor2.player2.name).toBe('Rascho, Aylin');
        expect(mainAmateur?.gameStages[1].games[0].competitor2.player2.nwtfvId).toBe(8777);
    }

    const mainPro = data.mainRound.divisions.find((division) => division.skillLevel === 'Pro');
    expect(mainPro).toBeDefined();
    expect(mainPro?.skillLevel).toBe('Pro');
    expect(mainPro?.gameStages).toHaveLength(5);
    expect(mainPro?.gameStages[0].name).toBe('Achtelfinale');
    expect(mainPro?.gameStages[1].name).toBe('Viertelfinale');
    expect(mainPro?.gameStages[2].name).toBe('Halbfinale');
    expect(mainPro?.gameStages[3].name).toBe('Platz 3');
    expect(mainPro?.gameStages[4].name).toBe('Finale');

    expect(mainPro?.gameStages[0].games).toHaveLength(1);
    expect(mainPro?.gameStages[1].games).toHaveLength(4);
    expect(mainPro?.gameStages[2].games).toHaveLength(2);
    expect(mainPro?.gameStages[3].games).toHaveLength(1);
    expect(mainPro?.gameStages[4].games).toHaveLength(1);

    expect(mainPro?.gameStages[4].games[0].competitor1.type).toBe('team');
    expect(mainPro?.gameStages[4].games[0].competitor2.type).toBe('team');
    expect(mainPro?.gameStages[4].games[0].scores).toHaveLength(1);
    expect(mainPro?.gameStages[4].games[0].scores[0].score1).toBe(1);
    expect(mainPro?.gameStages[4].games[0].scores[0].score2).toBe(0);
    if (mainPro?.gameStages[4].games[0].competitor1.type === 'team') {
        expect(mainPro?.gameStages[4].games[0].competitor1.player1.name).toBe('Röttger, Nico');
        expect(mainPro?.gameStages[4].games[0].competitor1.player1.nwtfvId).toBe(7896);
        expect(mainPro?.gameStages[4].games[0].competitor1.player2.name).toBe('Schmidt, Andreas');
        expect(mainPro?.gameStages[4].games[0].competitor1.player2.nwtfvId).toBe(9051);
    }
    if (mainPro?.gameStages[4].games[0].competitor2.type === 'team') {
        expect(mainPro?.gameStages[4].games[0].competitor2.player1.name).toBe('Fimpler, Josef');
        expect(mainPro?.gameStages[4].games[0].competitor2.player1.nwtfvId).toBe(7458);
        expect(mainPro?.gameStages[4].games[0].competitor2.player2.name).toBe('Ortmann, Thorsten');
        expect(mainPro?.gameStages[4].games[0].competitor2.player2.nwtfvId).toBe(7895);
    }
});
