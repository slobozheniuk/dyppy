import { test, expect } from 'vitest';
import { getTournaments, getTournamentDetails, Division } from '../../src/data-parser/tournaments.ts';

test('successfully parses multiple sub-tournaments for ID 5366', async () => {
    // Tournament 5366 contains 3 sub-disciplines: Damen Doppel (6407), Offenes Doppel (6406), Senioren Doppel (6408)
    const tournaments = await getTournaments({ tournamentIds: [5366] });

    expect(tournaments).toHaveLength(3);
    expect(tournaments.map(t => t.id).sort()).toEqual([6406, 6407, 6408].sort());
    tournaments.forEach(t => {
        expect(t.tournamentGroupID).toBe(5366);
    });
});

test('correctly parses Damen Doppel sub-tournament 6407', async () => {
    const data = await getTournamentDetails(6407, 5366);

    expect(data.id).toBe(6407);
    expect(data.tournamentGroupID).toBe(5366);
    expect(data.name).toBe('Stadtmeisterschaft Mönchengladbach');
    expect(data.date).toBe('01.03.2026');
    expect(data.place).toBe('Mönchengladbach');
    expect(data.type).toBe('Damen Doppel');
    expect(data.numberOfParticipants).toBe(7);
    expect(data.mainRound.finalPlacements).toHaveLength(7);

    const firstPlace = data.mainRound.finalPlacements[0];
    expect(firstPlace.rank).toBe(1);
    expect(firstPlace.competitor.type).toBe('team');
    if (firstPlace.competitor.type === 'team') {
        expect(firstPlace.competitor.player1.name).toBe('Ackerschott, Lina');
        expect(firstPlace.competitor.player1.nwtfvId).toBe(8249);
        expect(firstPlace.competitor.player2.name).toBe('Starren, Amber');
        expect(firstPlace.competitor.player2.nwtfvId).toBe(9105);
    }

    expect(data.mainRound.divisions).toHaveLength(0);
});

test('correctly parses Offenes Doppel sub-tournament 6406', async () => {
    const data = await getTournamentDetails(6406, 5366);

    expect(data.id).toBe(6406);
    expect(data.tournamentGroupID).toBe(5366);
    expect(data.name).toBe('Stadtmeisterschaft Mönchengladbach');
    expect(data.date).toBe('01.03.2026');
    expect(data.place).toBe('Mönchengladbach');
    expect(data.type).toBe('Offenes Doppel');
    expect(data.numberOfParticipants).toBe(42);
    expect(data.mainRound.finalPlacements).toHaveLength(42);
    expect(data.qualifyingRound?.finalPlacements).toHaveLength(42);

    const firstPlace = data.mainRound.finalPlacements[0];
    expect(firstPlace.rank).toBe(1);
    if (firstPlace.competitor.type === 'team') {
        expect(firstPlace.competitor.player1.name).toBe('Czakó, Gábor');
        expect(firstPlace.competitor.player1.nwtfvId).toBe(9056);
        expect(firstPlace.competitor.player2.name).toBe('Dost, Mark');
    }

    expect(data.mainRound.divisions).toHaveLength(3);
    const pro = data.mainRound.divisions.find((d: Division) => d.skillLevel === 'Pro');
    expect(pro).toBeDefined();
    expect(pro?.gameStages).toHaveLength(6);
    expect(pro?.gameStages[0].name).toBe('Sechzehntelfinale');
    expect(pro?.gameStages[0].games).toHaveLength(1);

    const proGame = pro?.gameStages[0].games[0];
    expect(proGame?.competitor1.type).toBe('team');
    if (proGame?.competitor1.type === 'team') {
        expect(proGame.competitor1.player1.name).toBe('Bardoul, Davy');
        expect(proGame.competitor1.player2.name).toBe('Seetsen, Menno');
    }
    expect(proGame?.scores[0]).toEqual({ score1: 1, score2: 0 });

    expect(pro?.gameStages[pro.gameStages.length - 1].name).toBe('Finale');

    const amateur = data.mainRound.divisions.find((d: Division) => d.skillLevel === 'Amateur');
    expect(amateur).toBeDefined();
    expect(amateur?.gameStages).toHaveLength(4);
    expect(amateur?.gameStages[0].name).toBe('Viertelfinale');
    expect(amateur?.gameStages[0].games).toHaveLength(4);

    const amateurGame = amateur?.gameStages[0].games[0];
    if (amateurGame?.competitor1.type === 'team') {
        expect(amateurGame.competitor1.player1.name).toBe('Weiß, Fabian');
        expect(amateurGame.competitor2.type).toBe('team');
    }

    const open = data.mainRound.divisions.find((d: Division) => d.skillLevel === 'Open');
    expect(open).toBeDefined();
    expect(open?.gameStages).toHaveLength(6);
    expect(open?.gameStages[0].name).toBe('Sechzehntelfinale');
    expect(open?.gameStages[0].games).toHaveLength(1);

    const openGame = open?.gameStages[0].games[0];
    if (openGame?.competitor1.type === 'team') {
        expect(openGame.competitor1.player1.name).toBe('Schulz, Uwe');
        expect(openGame.competitor2.type).toBe('team');
    }
});

test('correctly parses Senioren Doppel sub-tournament 6408', async () => {
    const data = await getTournamentDetails(6408, 5366);

    expect(data.id).toBe(6408);
    expect(data.tournamentGroupID).toBe(5366);
    expect(data.name).toBe('Stadtmeisterschaft Mönchengladbach');
    expect(data.date).toBe('01.03.2026');
    expect(data.place).toBe('Mönchengladbach');
    expect(data.type).toBe('Senioren Doppel');
    expect(data.numberOfParticipants).toBe(5);
    expect(data.mainRound.finalPlacements).toHaveLength(5);

    const winner = data.mainRound.finalPlacements[0];
    expect(winner.rank).toBe(1);
    if (winner.competitor.type === 'team') {
        expect(winner.competitor.player1.name).toBe('Heimanns, Christian');
        expect(winner.competitor.player1.nwtfvId).toBe(7599);
        expect(winner.competitor.player2.name).toBe('Plaspohl, Uwe');
        expect(winner.competitor.player2.nwtfvId).toBe(7590);
    }

    expect(data.mainRound.divisions).toHaveLength(0);
});
