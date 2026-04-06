import { describe, test, expect } from 'vitest';
import { patchDrawsInTournament, buildPlayerGamesMap, isDraw, DRAW_SCORES } from '../../src/transform/reconcile-draws';
import type { PlayerGames } from '../../src/fetch/players';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayer(name: string, nwtfvId?: number) {
  return { type: 'player' as const, player: { name, nwtfvId } };
}

function makeGame(
  competitor1: any,
  competitor2: any,
  scores = [{ score1: 1, score2: 0 }],
) {
  return { competitor1, competitor2, scores };
}

function makeTournament(games: any[], divisionSkillLevel = 'Open', stageName = '3. Runde', divisionHeading = 'Vorrunde') {
  return {
    id: 1,
    name: 'Mini - Challenger',
    mainRound: {
      finalPlacements: [],
      divisions: [
        {
          skillLevel: divisionSkillLevel,
          gameStages: [{ name: stageName, games }],
        },
      ],
    },
  };
}

// PlayerGames factory for a single-player draw game entry
function makePlayerDrawGame(
  tournamentName: string,
  roundName: string,
  roundStageName: string,
  playerId: number,
  opponentId: number,
): PlayerGames {
  return {
    einzel: [
      {
        date: new Date('2026-03-28'),
        tournamentName,
        roundName,
        roundStageName,
        result: 'draw',
        playerIds: [playerId],
        opponentIds: [opponentId],
      },
    ],
    doppel: [],
  };
}

// ─── isDraw ───────────────────────────────────────────────────────────────────

describe('isDraw', () => {
  test('returns true for draw sentinel', () => {
    expect(isDraw([{ score1: 0, score2: 0 }])).toBe(true);
  });

  test('returns false for a win-without-scores sentinel', () => {
    expect(isDraw([{ score1: 1, score2: 0 }])).toBe(false);
  });

  test('returns false for a real scored game', () => {
    expect(isDraw([{ score1: 5, score2: 3 }])).toBe(false);
  });

  test('returns false for multi-score games', () => {
    expect(isDraw([{ score1: 0, score2: 0 }, { score1: 1, score2: 0 }])).toBe(false);
  });
});

// ─── patchDrawsInTournament ───────────────────────────────────────────────────

describe('patchDrawsInTournament', () => {
  test('patches a draw correctly when both player IDs are present', () => {
    const game = makeGame(makePlayer('Slobozheniuk, Evgenii', 10034), makePlayer('Oberrecht, Bennet Henry', 10037));
    const tournament = makeTournament([game], 'Open', '3. Runde', 'Vorrunde');

    const playerGamesMap = new Map<number, PlayerGames>();
    playerGamesMap.set(10034, makePlayerDrawGame('Mini - Challenger', '3. Runde', 'Vorrunde', 10034, 10037));

    const patched = patchDrawsInTournament(tournament as any, playerGamesMap);

    expect(patched).toBe(1);
    expect(game.scores).toEqual(DRAW_SCORES);
  });

  test('patches via opponent player lookup too', () => {
    const game = makeGame(makePlayer('Slobozheniuk, Evgenii', 10034), makePlayer('Oberrecht, Bennet Henry', 10037));
    const tournament = makeTournament([game], 'Open', '3. Runde', 'Vorrunde');

    // Only 10037's perspective is in the map; the match entry has 10037 as player, 10034 as opponent
    const playerGamesMap = new Map<number, PlayerGames>();
    playerGamesMap.set(10037, {
      einzel: [{
        date: new Date('2026-03-28'),
        tournamentName: 'Mini - Challenger',
        roundName: '3. Runde',
        roundStageName: 'Vorrunde',
        result: 'draw',
        playerIds: [10034],     // note: spieler_1 is 10034 in this player's record
        opponentIds: [10037],
      }],
      doppel: [],
    });

    const patched = patchDrawsInTournament(tournament as any, playerGamesMap);
    expect(patched).toBe(1);
    expect(game.scores).toEqual(DRAW_SCORES);
  });

  test('does not patch when player history shows a win', () => {
    const game = makeGame(makePlayer('Player A', 1001), makePlayer('Player B', 1002));
    const tournament = makeTournament([game], 'Open', '1. Runde', 'Vorrunde');

    const playerGamesMap = new Map<number, PlayerGames>();
    playerGamesMap.set(1001, {
      einzel: [{
        date: new Date(),
        tournamentName: 'Mini - Challenger',
        roundName: '1. Runde',
        roundStageName: 'Vorrunde',
        result: 'win',         // NOT a draw
        playerIds: [1001],
        opponentIds: [1002],
      }],
      doppel: [],
    });

    const patched = patchDrawsInTournament(tournament as any, playerGamesMap);
    expect(patched).toBe(0);
    expect(game.scores).toEqual([{ score1: 1, score2: 0 }]);
  });

  test('does not patch when no players have history', () => {
    const game = makeGame(makePlayer('Unknown A'), makePlayer('Unknown B'));
    const tournament = makeTournament([game]);

    const patched = patchDrawsInTournament(tournament as any, new Map());
    expect(patched).toBe(0);
  });

  test('skips games that are already marked as draws', () => {
    const game = makeGame(makePlayer('A', 1), makePlayer('B', 2), [{ score1: 0, score2: 0 }]);
    const tournament = makeTournament([game]);

    // Even with a draw in the history, don't double-count
    const playerGamesMap = new Map<number, PlayerGames>();
    playerGamesMap.set(1, makePlayerDrawGame('Mini - Challenger', '3. Runde', 'Vorrunde', 1, 2));

    const patched = patchDrawsInTournament(tournament as any, playerGamesMap);
    expect(patched).toBe(0);
  });

  test('does not patch when tournament name does not match', () => {
    const game = makeGame(makePlayer('A', 1001), makePlayer('B', 1002));
    const tournament = makeTournament([game], 'Open', '3. Runde', 'Vorrunde');

    const playerGamesMap = new Map<number, PlayerGames>();
    playerGamesMap.set(1001, makePlayerDrawGame(
      'Completely Different Tournament', '3. Runde', 'Vorrunde', 1001, 1002,
    ));

    const patched = patchDrawsInTournament(tournament as any, playerGamesMap);
    expect(patched).toBe(0);
  });

  test('does not patch when round name does not match', () => {
    const game = makeGame(makePlayer('A', 1001), makePlayer('B', 1002));
    const tournament = makeTournament([game], 'Open', '3. Runde', 'Vorrunde');

    const playerGamesMap = new Map<number, PlayerGames>();
    playerGamesMap.set(1001, makePlayerDrawGame(
      'Mini - Challenger', '4. Runde', 'Vorrunde', 1001, 1002,   // wrong round
    ));

    const patched = patchDrawsInTournament(tournament as any, playerGamesMap);
    expect(patched).toBe(0);
  });

  test('patches Amateur division using Zusatzrunde label', () => {
    const game = makeGame(makePlayer('A', 1001), makePlayer('B', 1002));
    const tournament = makeTournament([game], 'Amateur', '3. Runde');

    const playerGamesMap = new Map<number, PlayerGames>();
    playerGamesMap.set(1001, makePlayerDrawGame(
      'Mini - Challenger', '3. Runde', 'Zusatzrunde', 1001, 1002,
    ));

    const patched = patchDrawsInTournament(tournament as any, playerGamesMap);
    expect(patched).toBe(1);
  });
});

// ─── buildPlayerGamesMap ──────────────────────────────────────────────────────

describe('buildPlayerGamesMap', () => {
  test('builds a map from raw player JSONs', () => {
    const rawJson = {
      data: {
        spieler: { spieler_id: '10034' },
        einzel: [
          {
            datum: '2026-03-28 00:00:00',
            spieler_1: { spieler_id: '10034', vorname: 'Evgenii', nachname: 'Slobozheniuk' },
            spieler_2: null,
            gegner_1: { spieler_id: '10037', vorname: 'Bennet Henry', nachname: 'Oberrecht' },
            gegner_2: null,
            veranstaltung: 'Mini - Challenger',
            runde: '3. Runde',
            runde_stufe: '2. Zusatzrunde',
            ergebnis: 0,
          },
        ],
        doppel: [],
      },
    };

    const map = buildPlayerGamesMap([rawJson]);
    expect(map.has(10034)).toBe(true);

    const games = map.get(10034)!;
    expect(games.einzel).toHaveLength(1);
    expect(games.einzel[0].result).toBe('draw');
    expect(games.einzel[0].roundName).toBe('3. Runde');
    expect(games.einzel[0].roundStageName).toBe('2. Zusatzrunde');
    expect(games.einzel[0].playerIds).toContain(10034);
    expect(games.einzel[0].opponentIds).toContain(10037);
  });

  test('ignores malformed entries', () => {
    const map = buildPlayerGamesMap([{ data: {} }, null as any, undefined as any]);
    expect(map.size).toBe(0);
  });
});
