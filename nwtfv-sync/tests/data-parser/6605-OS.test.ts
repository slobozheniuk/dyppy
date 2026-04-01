import { test, expect } from 'vitest';
import { getTournamentDetails } from '../../src/data-parser/tournaments.ts';

test('correctly parses OS tournament 6605 without scores', async () => {
    const data = await getTournamentDetails(6605);

    expect(data).toBeDefined();
    expect(data.id).toBe(6605);
    expect(data.date).toBe('28.03.2026');
    expect(data.name).toBe('Mini - Challenger');
    expect(data.type).toBe('Offenes Einzel');
    expect(data.place).toBe('Gronau');
    expect(data.numberOfParticipants).toBe(9);
    expect(data.mainRound.finalPlacements).toHaveLength(9);
    expect(data.qualifyingRound).toBeUndefined();

    const fourthMain = data.mainRound.finalPlacements[2];
    expect(fourthMain.rank).toBe(3);
    expect(fourthMain.competitor.type).toBe('player');
    if (fourthMain.competitor.type === 'player') {
        expect(fourthMain.competitor.player.name).toBe('Slobozheniuk, Evgenii');
        expect(fourthMain.competitor.player.nwtfvId).toBe(10034);
    }

    expect(data.mainRound.divisions).toHaveLength(3);
    const mainPro = data.mainRound.divisions.find(d => d.skillLevel === 'Pro');
    expect(mainPro).toBeDefined();
    expect(mainPro?.gameStages).toHaveLength(4);
    expect(mainPro?.gameStages[0].name).toBe('Viertelfinale');
    expect(mainPro?.gameStages[3].name).toBe('Finale');
    expect(mainPro?.gameStages[0].games).toHaveLength(1);

    const mainAmateur = data.mainRound.divisions.find(d => d.skillLevel === 'Amateur');
    expect(mainAmateur).toBeDefined();
    expect(mainAmateur?.gameStages).toHaveLength(3);
    expect(mainAmateur?.gameStages[0].name).toBe('Halbfinale');
    expect(mainAmateur?.gameStages[0].games).toHaveLength(2);

    const mainOpen = data.mainRound.divisions.find(d => d.skillLevel === 'Open');
    expect(mainOpen).toBeDefined();
    expect(mainOpen?.gameStages).toHaveLength(6);
    expect(mainOpen?.gameStages[0].name).toBe('1. Runde');
    expect(mainOpen?.gameStages[0].games).toHaveLength(4);    
});
