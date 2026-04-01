import { test, expect } from 'vitest';
import { getTournamentDetails } from '../../src/data-parser/tournaments.ts';

test('correctly parses OD tournament 6382 without scores', async () => {
    // Note: this test requires network access to the designated tournament ID
    const data = await getTournamentDetails(6382);

    expect(data).toBeDefined();
    // Check first item based on example-tournaments.html
    expect(data.id).toBe(6382);
    expect(data.date).toEqual(new Date(2026, 2, 20));
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

    expect(data.qualifyingRound?.divisions).toHaveLength(1);
    expect(data.mainRound.divisions).toHaveLength(2);

    const qualifyingOpen = data.qualifyingRound!.divisions[0];
    expect(qualifyingOpen!.skillLevel).toBe('Open');
    const qualifyingStages = qualifyingOpen!.gameStages;
    expect(qualifyingStages).toHaveLength(5);
    expect(qualifyingStages[0].name).toBe('1. Runde');
    expect(qualifyingStages[0].games).toHaveLength(12);
    expect(qualifyingStages[0].games[0].competitor1.type).toBe('team');
    expect(qualifyingStages[0].games[0].competitor2.type).toBe('team');
    expect(qualifyingStages[0].games[0].scores).toHaveLength(1);
    expect(qualifyingStages[0].games[0].scores[0].score1).toBe(1);
    expect(qualifyingStages[0].games[0].scores[0].score2).toBe(0);
    if (qualifyingStages[0].games[0].competitor1.type === 'team') {
        expect(qualifyingStages[0].games[0].competitor1.player1.name).toBe('Berberich, Mika');
        expect(qualifyingStages[0].games[0].competitor1.player1.nwtfvId).toBe(9027);
        expect(qualifyingStages[0].games[0].competitor1.player2.name).toBe('Wahl, Johann');
        expect(qualifyingStages[0].games[0].competitor1.player2.nwtfvId).toBe(452);
    }
    if (qualifyingStages[0].games[0].competitor2.type === 'team') {
        expect(qualifyingStages[0].games[0].competitor2.player1.name).toBe('Rademacher, Thomas');
        expect(qualifyingStages[0].games[0].competitor2.player1.nwtfvId).toBe(9039);
        expect(qualifyingStages[0].games[0].competitor2.player2.name).toBe('Remberg, Florian');
        expect(qualifyingStages[0].games[0].competitor2.player2.nwtfvId).toBe(8274);
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

    expect(mainAmateur?.gameStages[0].games).toHaveLength(5);
    expect(mainAmateur?.gameStages[1].games).toHaveLength(4);
    expect(mainAmateur?.gameStages[2].games).toHaveLength(2);
    expect(mainAmateur?.gameStages[3].games).toHaveLength(1);
    expect(mainAmateur?.gameStages[4].games).toHaveLength(1);

    expect(mainAmateur?.gameStages[0].games[0].competitor1.type).toBe('team');
    expect(mainAmateur?.gameStages[0].games[0].competitor2.type).toBe('team');
    expect(mainAmateur?.gameStages[0].games[0].scores).toHaveLength(1);
    expect(mainAmateur?.gameStages[0].games[0].scores[0].score1).toBe(1);
    expect(mainAmateur?.gameStages[0].games[0].scores[0].score2).toBe(0);
    if (mainAmateur?.gameStages[0].games[0].competitor1.type === 'team') {
        expect(mainAmateur?.gameStages[0].games[0].competitor1.player1.name).toBe('Müller, Dirk');
        expect(mainAmateur?.gameStages[0].games[0].competitor1.player1.nwtfvId).toBe(273);
        expect(mainAmateur?.gameStages[0].games[0].competitor1.player2.name).toBe('Bohl, Alex');
        expect(mainAmateur?.gameStages[0].games[0].competitor1.player2.nwtfvId).toBe(485);
    }
    if (mainAmateur?.gameStages[0].games[0].competitor2.type === 'team') {
        expect(mainAmateur?.gameStages[0].games[0].competitor2.player1.name).toBe('Klemm, Markus');
        expect(mainAmateur?.gameStages[0].games[0].competitor2.player1.nwtfvId).toBe(9741);
        expect(mainAmateur?.gameStages[0].games[0].competitor2.player2.name).toBe('Schmidt, Robert');
        expect(mainAmateur?.gameStages[0].games[0].competitor2.player2.nwtfvId).toBe(7846);
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

    expect(mainPro?.gameStages[0].games).toHaveLength(4);
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
        expect(mainPro?.gameStages[4].games[0].competitor2.player1.name).toBe('Kretschmer, Andreas');
        expect(mainPro?.gameStages[4].games[0].competitor2.player1.nwtfvId).toBe(7941);
        expect(mainPro?.gameStages[4].games[0].competitor2.player2.name).toBe('Hazwani, Rami');
        expect(mainPro?.gameStages[4].games[0].competitor2.player2.nwtfvId).toBe(158);
    }
});
