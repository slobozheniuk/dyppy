import { test, expect } from 'vitest';
import { getTournamentDetails } from '../../src/data-parser/tournaments.ts';

test('correctly parses OS tournament 6371 without scores', async () => {
    const data = await getTournamentDetails(6371);

    expect(data).toBeDefined();
    expect(data.id).toBe(6371);
    expect(data.date).toEqual(new Date(2026, 1, 25));
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

    expect(data.qualifyingRound?.divisions).toHaveLength(1);
    expect(data.mainRound.divisions).toHaveLength(2);

    const qualifyingOpen = data.qualifyingRound!.divisions[0];
    expect(qualifyingOpen!.skillLevel).toBe('Open');
    const qualifyingStages = qualifyingOpen!.gameStages;
    // For 13 participants, it likely has 6 rounds of qualifying
    expect(qualifyingStages.length).toBeGreaterThanOrEqual(5);
    expect(qualifyingStages[0].name).toBe('1. Runde');
    expect(qualifyingStages[0].games).toHaveLength(6);
    expect(qualifyingStages[0].games[0].competitor1.type).toBe('player');
    expect(qualifyingStages[0].games[0].competitor2.type).toBe('player');
    expect(qualifyingStages[0].games[0].scores).toHaveLength(1);
    expect(qualifyingStages[0].games[0].scores[0].score1).toBe(1);
    expect(qualifyingStages[0].games[0].scores[0].score2).toBe(0);
    if (qualifyingStages[0].games[0].competitor1.type === 'player') {
        expect(qualifyingStages[0].games[0].competitor1.player.name).toBe('Meyer, Dominik');
        expect(qualifyingStages[0].games[0].competitor1.player.nwtfvId).toBe(8722);
    }
    if (qualifyingStages[0].games[0].competitor2.type === 'player') {
        expect(qualifyingStages[0].games[0].competitor2.player.name).toBe('Telaar, Franz-Josef');
        expect(qualifyingStages[0].games[0].competitor2.player.nwtfvId).toBe(9109);
    }

    const mainPro = data.mainRound.divisions.find(d => d.skillLevel === 'Pro');
    expect(mainPro).toBeDefined();
    expect(mainPro?.gameStages).toHaveLength(4);
    expect(mainPro?.gameStages[0].name).toBe('Viertelfinale');
    expect(mainPro?.gameStages[3].name).toBe('Finale');
    expect(mainPro?.gameStages[0].games).toHaveLength(2);

    const mainAmateur = data.mainRound.divisions.find(d => d.skillLevel === 'Amateur');
    expect(mainAmateur).toBeDefined();
    expect(mainAmateur?.gameStages).toHaveLength(4);
    expect(mainAmateur?.gameStages[0].name).toBe('Viertelfinale');
    expect(mainAmateur?.gameStages[0].games).toHaveLength(3);
});
