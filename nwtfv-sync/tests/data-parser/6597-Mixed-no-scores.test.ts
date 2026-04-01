import { test, expect } from 'vitest';
import { getTournamentDetails, Division } from '../../src/data-parser/tournaments.ts';

test('correctly parses Mixed tournament 6597 without scores', async () => {
  const tournamentId = 6597;
  const data = await getTournamentDetails(tournamentId);

  expect(data.id).toBe(tournamentId);
  expect(data.name).toBe('Köln Mixed März');
  expect(data.date).toEqual(new Date(2026, 2, 7));
  expect(data.place).toBe('Köln');
  expect(data.type).toBe('Mixed');
  expect(data.numberOfParticipants).toBe(15);

  // Final placements checks
  expect(data.mainRound.finalPlacements).toHaveLength(15);
  const firstPlace = data.mainRound.finalPlacements[0];
  expect(firstPlace.rank).toBe(1);
  expect(firstPlace.competitor.type).toBe('team');
  if (firstPlace.competitor.type === 'team') {
    expect(firstPlace.competitor.player1.name).toBe('Ackerschott, Lina');
    expect(firstPlace.competitor.player1.nwtfvId).toBe(8249);
    expect(firstPlace.competitor.player2.name).toBe('Hahne, Nils');
    expect(firstPlace.competitor.player2.nwtfvId).toBe(7381);
  }

  const secondPlace = data.mainRound.finalPlacements[1];
  expect(secondPlace.rank).toBe(2);
  if (secondPlace.competitor.type === 'team') {
    expect(secondPlace.competitor.player1.name).toBe('Czakó, Gábor');
    expect(secondPlace.competitor.player1.nwtfvId).toBe(9056);
    expect(secondPlace.competitor.player2.name).toBe('Gelissen, Michelle');
    expect(secondPlace.competitor.player2.nwtfvId).toBe(9959);
  }

  // Qualifying round checks
  expect(data.qualifyingRound?.finalPlacements).toHaveLength(15);
  const qualFirst = data.qualifyingRound?.finalPlacements[0];
  expect(qualFirst?.rank).toBe(1);
  if (qualFirst?.competitor.type === 'team') {
    expect(qualFirst.competitor.player1.name).toBe('Wehrenfennig, Stefanie');
    expect(qualFirst.competitor.player1.nwtfvId).toBe(815);
    expect(qualFirst.competitor.player2.name).toBe('Berberich, Mika');
    expect(qualFirst.competitor.player2.nwtfvId).toBe(9027);
  }

  // Division checks
  expect(data.mainRound.divisions).toHaveLength(2);

  const proDivision = data.mainRound.divisions.find((d: Division) => d.skillLevel === 'Pro');
  expect(proDivision).toBeDefined();
  expect(proDivision?.gameStages).toHaveLength(4);
  expect(proDivision?.gameStages[0].name).toBe('Viertelfinale');
  expect(proDivision?.gameStages[0].games).toHaveLength(3);
  expect(proDivision?.gameStages[proDivision.gameStages.length - 1].name).toBe('Finale');

  const proGame = proDivision?.gameStages[0].games[0];
  if (proGame?.competitor1.type === 'team') {
    expect(proGame.competitor1.player1.name).toBe('Czakó, Gábor');
    expect(proGame.competitor1.player1.nwtfvId).toBe(9056);
    expect(proGame.competitor2.type).toBe('team');
    if (proGame.competitor2.type === 'team') {
      expect(proGame.competitor2.player1.name).toBe('Harig, Säpenta');
      expect(proGame.competitor2.player1.nwtfvId).toBeUndefined();
    }
  }

  const amateurDivision = data.mainRound.divisions.find((d: Division) => d.skillLevel === 'Amateur');
  expect(amateurDivision).toBeDefined();
  expect(amateurDivision?.gameStages).toHaveLength(4);
  expect(amateurDivision?.gameStages[0].name).toBe('Viertelfinale');
  expect(amateurDivision?.gameStages[0].games).toHaveLength(4);

  const amateurGame = amateurDivision?.gameStages[0].games[0];
  if (amateurGame?.competitor1.type === 'team') {
    expect(amateurGame.competitor1.player1.name).toBe('Kratz, Gerd');
    expect(amateurGame.competitor1.player1.nwtfvId).toBe(7463);
    if (amateurGame.competitor2.type === 'team') {
      expect(amateurGame.competitor2.player1.name).toBe('Welter, Johannes');
      expect(amateurGame.competitor2.player1.nwtfvId).toBe(8815);
    }
  }
});
