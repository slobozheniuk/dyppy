import { test, expect } from 'vitest';
import { getTournamentDetails } from '../tournaments.ts';

test('correctly parses OD tournament 6554 with scores', async () => {
    const data = await getTournamentDetails(6554);

    expect(data.id).toBe(6554);
    expect(data.date).toBe('15.03.2026');
    expect(data.name).toBe('Mini - Challenger');
    expect(data.type).toBe('Offenes Doppel');
    expect(data.place).toBe('Würselen');
    expect(data.numberOfParticipants).toBe(16);
    expect(data.qualifyingRound!.finalPlacements).toHaveLength(16);
    expect(data.mainRound.finalPlacements).toHaveLength(16);


    const firstQual = data.qualifyingRound?.finalPlacements[0];
    expect(firstQual?.rank).toBe(1);
    expect(firstQual?.competitor.type).toBe('team');
    if (firstQual?.competitor.type === 'team') {
        expect(firstQual.competitor.player1.name).toBe('van Dijk, Steven');
        expect(firstQual.competitor.player1.nwtfvId).toBeUndefined();
        expect(firstQual.competitor.player2.name).toBe('Seetsen, Menno');
        expect(firstQual.competitor.player2.nwtfvId).toBeUndefined();
    }

    const firstMain = data.mainRound.finalPlacements[0];
    expect(firstMain.rank).toBe(1);
    expect(firstMain.competitor.type).toBe('team');
    if (firstMain.competitor.type === 'team') {
        expect(firstMain.competitor.player1.name).toBe('Li Pira, Claudio');
        expect(firstMain.competitor.player1.nwtfvId).toBe(242);
        expect(firstMain.competitor.player2.name).toBe('Nolte, Lars');
        expect(firstMain.competitor.player2.nwtfvId).toBe(290);
    }

    expect(data.qualifyingRound?.divisions).toHaveLength(1);
    expect(data.mainRound.divisions).toHaveLength(2);

    const qualifyingAll = data.qualifyingRound!.divisions[0];
    expect(qualifyingAll!.skillLevel).toBe('Open');
    const qualifyingStages = qualifyingAll!.gameStages;
    expect(qualifyingStages).toHaveLength(5);
    expect(qualifyingStages[4].name).toBe('5. Runde');
    expect(qualifyingStages[4].games).toHaveLength(8);
    expect(qualifyingStages[4].games[3].competitor1.type).toBe('team');
    expect(qualifyingStages[4].games[3].competitor2.type).toBe('team');
    expect(qualifyingStages[4].games[3].scores).toHaveLength(3);
    expect(qualifyingStages[4].games[3].scores[0].score1).toBe(5);
    expect(qualifyingStages[4].games[3].scores[0].score2).toBe(1);
    expect(qualifyingStages[4].games[3].scores[1].score1).toBe(2);
    expect(qualifyingStages[4].games[3].scores[1].score2).toBe(5);
    expect(qualifyingStages[4].games[3].scores[2].score1).toBe(8);
    expect(qualifyingStages[4].games[3].scores[2].score2).toBe(7);
    if (qualifyingStages[4].games[3].competitor1.type === 'team') {
        expect(qualifyingStages[4].games[3].competitor1.player1.name).toBe('Jansen, Danny');
        expect(qualifyingStages[4].games[3].competitor1.player1.nwtfvId).toBe(9000);
        expect(qualifyingStages[4].games[3].competitor1.player2.name).toBe('Camp, Shem op den');
        expect(qualifyingStages[4].games[3].competitor1.player2.nwtfvId).toBeUndefined();
    }
    if (qualifyingStages[4].games[3].competitor2.type === 'team') {
        expect(qualifyingStages[4].games[3].competitor2.player1.name).toBe('Miranda, Lenne');
        expect(qualifyingStages[4].games[3].competitor2.player1.nwtfvId).toBe(9080);
        expect(qualifyingStages[4].games[3].competitor2.player2.name).toBe('Miranda, Edwin');
        expect(qualifyingStages[4].games[3].competitor2.player2.nwtfvId).toBeUndefined();
    }

    const mainAmateur = data.mainRound.divisions.find((division) => division.skillLevel === 'Amateur');
    expect(mainAmateur).toBeDefined();
    expect(mainAmateur?.skillLevel).toBe('Amateur');
    expect(mainAmateur?.gameStages).toHaveLength(4);
    expect(mainAmateur?.gameStages[0].name).toBe('Viertelfinale');
    expect(mainAmateur?.gameStages[1].name).toBe('Halbfinale');
    expect(mainAmateur?.gameStages[2].name).toBe('Platz 3');
    expect(mainAmateur?.gameStages[3].name).toBe('Finale');

    expect(mainAmateur?.gameStages[0].games).toHaveLength(4);
    expect(mainAmateur?.gameStages[1].games).toHaveLength(2);
    expect(mainAmateur?.gameStages[2].games).toHaveLength(1);
    expect(mainAmateur?.gameStages[3].games).toHaveLength(1);

    expect(mainAmateur?.gameStages[1].games[0].competitor1.type).toBe('team');
    expect(mainAmateur?.gameStages[1].games[0].competitor2.type).toBe('team');
    expect(mainAmateur?.gameStages[1].games[0].scores).toHaveLength(2);
    expect(mainAmateur?.gameStages[1].games[0].scores[0].score1).toBe(5);
    expect(mainAmateur?.gameStages[1].games[0].scores[0].score2).toBe(0);
    expect(mainAmateur?.gameStages[1].games[0].scores[1].score1).toBe(5);
    expect(mainAmateur?.gameStages[1].games[0].scores[1].score2).toBe(1);
    if (mainAmateur?.gameStages[1].games[0].competitor1.type === 'team') {
        expect(mainAmateur?.gameStages[1].games[0].competitor1.player1.name).toBe('Baars, Bernd');
        expect(mainAmateur?.gameStages[1].games[0].competitor1.player1.nwtfvId).toBe(9);
        expect(mainAmateur?.gameStages[1].games[0].competitor1.player2.name).toBe('Koch, Robert');
        expect(mainAmateur?.gameStages[1].games[0].competitor1.player2.nwtfvId).toBe(9752);
    }
    if (mainAmateur?.gameStages[1].games[0].competitor2.type === 'team') {
        expect(mainAmateur?.gameStages[1].games[0].competitor2.player1.name).toBe('Sintzen, Kai');
        expect(mainAmateur?.gameStages[1].games[0].competitor2.player1.nwtfvId).toBeUndefined();
        expect(mainAmateur?.gameStages[1].games[0].competitor2.player2.name).toBe('Boekhorst, Hans');
        expect(mainAmateur?.gameStages[1].games[0].competitor2.player2.nwtfvId).toBeUndefined();
    }

    const mainPro = data.mainRound.divisions.find((division) => division.skillLevel === 'Pro');
    expect(mainPro).toBeDefined();
    expect(mainPro?.skillLevel).toBe('Pro');
    expect(mainPro?.gameStages).toHaveLength(4);
    expect(mainPro?.gameStages[0].name).toBe('Viertelfinale');
    expect(mainPro?.gameStages[1].name).toBe('Halbfinale');
    expect(mainPro?.gameStages[2].name).toBe('Platz 3');
    expect(mainPro?.gameStages[3].name).toBe('Finale');

    expect(mainPro?.gameStages[0].games).toHaveLength(4);
    expect(mainPro?.gameStages[1].games).toHaveLength(2);
    expect(mainPro?.gameStages[2].games).toHaveLength(1);
    expect(mainPro?.gameStages[3].games).toHaveLength(1);

    expect(mainPro?.gameStages[0].games[2].competitor1.type).toBe('team');
    expect(mainPro?.gameStages[0].games[2].competitor2.type).toBe('team');
    expect(mainPro?.gameStages[0].games[2].scores).toHaveLength(5);
    expect(mainPro?.gameStages[0].games[2].scores[0].score1).toBe(3);
    expect(mainPro?.gameStages[0].games[2].scores[0].score2).toBe(5);
    expect(mainPro?.gameStages[0].games[2].scores[1].score1).toBe(5);
    expect(mainPro?.gameStages[0].games[2].scores[1].score2).toBe(4);
    expect(mainPro?.gameStages[0].games[2].scores[2].score1).toBe(5);
    expect(mainPro?.gameStages[0].games[2].scores[2].score2).toBe(2);
    expect(mainPro?.gameStages[0].games[2].scores[3].score1).toBe(4);
    expect(mainPro?.gameStages[0].games[2].scores[3].score2).toBe(5);
    expect(mainPro?.gameStages[0].games[2].scores[4].score1).toBe(5);
    expect(mainPro?.gameStages[0].games[2].scores[4].score2).toBe(3);
    if (mainPro?.gameStages[0].games[2].competitor1.type === 'team') {
        expect(mainPro?.gameStages[0].games[2].competitor1.player1.name).toBe('Li Pira, Claudio');
        expect(mainPro?.gameStages[0].games[2].competitor1.player1.nwtfvId).toBe(242);
        expect(mainPro?.gameStages[0].games[2].competitor1.player2.name).toBe('Nolte, Lars');
        expect(mainPro?.gameStages[0].games[2].competitor1.player2.nwtfvId).toBe(290);
    }
    if (mainPro?.gameStages[0].games[2].competitor2.type === 'team') {
        expect(mainPro?.gameStages[0].games[2].competitor2.player1.name).toBe('Miranda, Lenne');
        expect(mainPro?.gameStages[0].games[2].competitor2.player1.nwtfvId).toBe(9080);
        expect(mainPro?.gameStages[0].games[2].competitor2.player2.name).toBe('Miranda, Edwin');
        expect(mainPro?.gameStages[0].games[2].competitor2.player2.nwtfvId).toBeUndefined();
    }
});
