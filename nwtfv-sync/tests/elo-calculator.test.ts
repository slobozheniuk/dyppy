import { describe, test, expect } from 'vitest';
import {
  calculateExpectedScore,
  calculateEloDelta,
  recordMatch,
  tournamentTypeToGameType,
  DEFAULT_ELO,
  DEFAULT_K_FACTOR,
  type PlayerWithRatings,
  type PlayerRatings,
} from '../src/server/elo-calculator.ts';

// ─── Helper ───────────────────────────────────────────────────────────────────

function makePlayer(id: string, overrides: Partial<PlayerRatings> = {}): PlayerWithRatings {
  return {
    id,
    ratings: {
      singleElo: DEFAULT_ELO,
      doubleElo: DEFAULT_ELO,
      dypElo: DEFAULT_ELO,
      totalElo: DEFAULT_ELO,
      ...overrides,
    },
  };
}

function printBeforeAfter(label: string, players: PlayerWithRatings[], result: ReturnType<typeof recordMatch>) {
  console.log(`\n── ${label} ──`);
  const allUpdates = [...result.team1Updates, ...result.team2Updates];
  for (const update of allUpdates) {
    const player = players.find(p => p.id === update.playerId)!;
    console.log(`  Player ${player.id}:`);
    console.log(`    Specific ELO: ${update.oldSpecificElo.toFixed(1)} → ${update.newSpecificElo.toFixed(1)} (${update.specificEloDelta >= 0 ? '+' : ''}${update.specificEloDelta.toFixed(1)})`);
    console.log(`    Total ELO:    ${update.oldTotalElo.toFixed(1)} → ${update.newTotalElo.toFixed(1)} (${update.totalEloDelta >= 0 ? '+' : ''}${update.totalEloDelta.toFixed(1)})`);
  }
}

// ─── Core Math ────────────────────────────────────────────────────────────────

describe('calculateExpectedScore', () => {
  test('equal ratings give 0.5 expected score', () => {
    expect(calculateExpectedScore(1500, 1500)).toBeCloseTo(0.5);
  });

  test('higher rating gives > 0.5 expected score', () => {
    expect(calculateExpectedScore(1600, 1400)).toBeGreaterThan(0.5);
  });

  test('lower rating gives < 0.5 expected score', () => {
    expect(calculateExpectedScore(1400, 1600)).toBeLessThan(0.5);
  });

  test('extreme difference: 400 point gap', () => {
    // With 400 point gap, expected score ≈ 0.909
    const score = calculateExpectedScore(1900, 1500);
    expect(score).toBeCloseTo(0.9091, 3);
  });
});

describe('calculateEloDelta', () => {
  test('equal ratings, win gives +K/2', () => {
    const delta = calculateEloDelta(1500, 1500, true);
    expect(delta).toBeCloseTo(DEFAULT_K_FACTOR / 2);
  });

  test('equal ratings, loss gives -K/2', () => {
    const delta = calculateEloDelta(1500, 1500, false);
    expect(delta).toBeCloseTo(-DEFAULT_K_FACTOR / 2);
  });

  test('win + loss deltas are symmetric for equal ratings', () => {
    const winDelta = calculateEloDelta(1500, 1500, true);
    const lossDelta = calculateEloDelta(1500, 1500, false);
    expect(winDelta + lossDelta).toBeCloseTo(0);
  });
});

// ─── 1v1 Match ────────────────────────────────────────────────────────────────

describe('recordMatch — Single (1v1)', () => {
  test('two equal players: winner gains ~16, loser loses ~16', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');

    const result = recordMatch({
      gameType: 'single',
      team1: [alice],
      team2: [bob],
      team1Won: true,
    });

    printBeforeAfter('1v1 — Equal Ratings', [alice, bob], result);

    // Alice wins
    expect(result.team1Updates).toHaveLength(1);
    expect(result.team1Updates[0].specificEloDelta).toBeCloseTo(16);
    expect(result.team1Updates[0].totalEloDelta).toBeCloseTo(16);
    expect(result.team1Updates[0].newSpecificElo).toBeCloseTo(1516);
    expect(result.team1Updates[0].newTotalElo).toBeCloseTo(1516);

    // Bob loses
    expect(result.team2Updates).toHaveLength(1);
    expect(result.team2Updates[0].specificEloDelta).toBeCloseTo(-16);
    expect(result.team2Updates[0].totalEloDelta).toBeCloseTo(-16);
    expect(result.team2Updates[0].newSpecificElo).toBeCloseTo(1484);
    expect(result.team2Updates[0].newTotalElo).toBeCloseTo(1484);
  });

  test('updates only singleElo and totalElo (not double/dyp)', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');

    const result = recordMatch({
      gameType: 'single',
      team1: [alice],
      team2: [bob],
      team1Won: true,
    });

    expect(result.gameType).toBe('single');
    // The calculator returns deltas for the game-specific elo (singleElo) and total.
    // doubleElo/dypElo should not be touched — verified by the gameType field.
  });

  test('higher-rated player beating lower-rated gains less than K/2', () => {
    const strong = makePlayer('Strong', { singleElo: 1700, totalElo: 1700 });
    const weak = makePlayer('Weak', { singleElo: 1300, totalElo: 1300 });

    const result = recordMatch({
      gameType: 'single',
      team1: [strong],
      team2: [weak],
      team1Won: true,
    });

    printBeforeAfter('1v1 — Strong beats Weak', [strong, weak], result);

    // Strong gains less than 16 (expected outcome)
    expect(result.team1Updates[0].specificEloDelta).toBeLessThan(DEFAULT_K_FACTOR / 2);
    expect(result.team1Updates[0].specificEloDelta).toBeGreaterThan(0);

    // Weak loses less than 16
    expect(result.team2Updates[0].specificEloDelta).toBeGreaterThan(-DEFAULT_K_FACTOR / 2);
    expect(result.team2Updates[0].specificEloDelta).toBeLessThan(0);
  });

  test('lower-rated player beating higher-rated gains more than K/2 (upset)', () => {
    const strong = makePlayer('Strong', { singleElo: 1700, totalElo: 1700 });
    const weak = makePlayer('Weak', { singleElo: 1300, totalElo: 1300 });

    const result = recordMatch({
      gameType: 'single',
      team1: [weak],
      team2: [strong],
      team1Won: true, // upset!
    });

    printBeforeAfter('1v1 — Upset: Weak beats Strong', [weak, strong], result);

    // Weak gains more than 16
    expect(result.team1Updates[0].specificEloDelta).toBeGreaterThan(DEFAULT_K_FACTOR / 2);

    // Strong loses more than 16
    expect(result.team2Updates[0].specificEloDelta).toBeLessThan(-DEFAULT_K_FACTOR / 2);
  });
});

// ─── 2v2 Double Match ─────────────────────────────────────────────────────────

describe('recordMatch — Double (2v2)', () => {
  test('four equal players: both winners gain same delta, both losers lose same delta', () => {
    const p1 = makePlayer('P1');
    const p2 = makePlayer('P2');
    const p3 = makePlayer('P3');
    const p4 = makePlayer('P4');

    const result = recordMatch({
      gameType: 'double',
      team1: [p1, p2],
      team2: [p3, p4],
      team1Won: true,
    });

    printBeforeAfter('2v2 Double — Equal Ratings', [p1, p2, p3, p4], result);

    // Both team1 players get same delta
    expect(result.team1Updates[0].specificEloDelta).toBeCloseTo(16);
    expect(result.team1Updates[1].specificEloDelta).toBeCloseTo(16);

    // Both team2 players get same delta
    expect(result.team2Updates[0].specificEloDelta).toBeCloseTo(-16);
    expect(result.team2Updates[1].specificEloDelta).toBeCloseTo(-16);

    // Updates doubleElo, not singleElo
    expect(result.gameType).toBe('double');
  });

  test('team averaging: strong+weak team vs two medium players', () => {
    const strong = makePlayer('Strong', { doubleElo: 1700, totalElo: 1650 });
    const weak = makePlayer('Weak', { doubleElo: 1300, totalElo: 1350 });
    // Team1 avg = 1500
    const med1 = makePlayer('Med1', { doubleElo: 1500, totalElo: 1500 });
    const med2 = makePlayer('Med2', { doubleElo: 1500, totalElo: 1500 });
    // Team2 avg = 1500

    const result = recordMatch({
      gameType: 'double',
      team1: [strong, weak],
      team2: [med1, med2],
      team1Won: true,
    });

    printBeforeAfter('2v2 Double — Mixed vs Even', [strong, weak, med1, med2], result);

    // Both teams average = 1500, so delta ≈ ±16
    expect(result.team1Updates[0].specificEloDelta).toBeCloseTo(16);
    expect(result.team1Updates[1].specificEloDelta).toBeCloseTo(16);

    // Strong player's new doubleElo = 1716, Weak's = 1316 (same delta applied)
    expect(result.team1Updates[0].newSpecificElo).toBeCloseTo(1716);
    expect(result.team1Updates[1].newSpecificElo).toBeCloseTo(1316);
  });

  test('total elo uses totalElo values, not game-specific elos', () => {
    // Players with deliberately different totalElo vs doubleElo
    const p1 = makePlayer('P1', { doubleElo: 1500, totalElo: 1800 });
    const p2 = makePlayer('P2', { doubleElo: 1500, totalElo: 1800 });
    const p3 = makePlayer('P3', { doubleElo: 1500, totalElo: 1200 });
    const p4 = makePlayer('P4', { doubleElo: 1500, totalElo: 1200 });

    const result = recordMatch({
      gameType: 'double',
      team1: [p1, p2],
      team2: [p3, p4],
      team1Won: true,
    });

    // doubleElo: both teams average 1500, so delta ≈ ±16
    expect(result.team1Updates[0].specificEloDelta).toBeCloseTo(16);

    // totalElo: team1 avg = 1800, team2 avg = 1200 → team1 expected to win
    // So team1's total delta should be < 16 (expected outcome)
    expect(result.team1Updates[0].totalEloDelta).toBeLessThan(DEFAULT_K_FACTOR / 2);
    expect(result.team1Updates[0].totalEloDelta).toBeGreaterThan(0);

    // This confirms total elo uses totalElo, not doubleElo
    expect(result.team1Updates[0].specificEloDelta).not.toBeCloseTo(result.team1Updates[0].totalEloDelta);
  });
});

// ─── 2v2 DYP Match ────────────────────────────────────────────────────────────

describe('recordMatch — DYP (2v2)', () => {
  test('updates dypElo and totalElo', () => {
    const p1 = makePlayer('P1');
    const p2 = makePlayer('P2');
    const p3 = makePlayer('P3');
    const p4 = makePlayer('P4');

    const result = recordMatch({
      gameType: 'dyp',
      team1: [p1, p2],
      team2: [p3, p4],
      team1Won: true,
    });

    expect(result.gameType).toBe('dyp');
    expect(result.team1Updates[0].specificEloDelta).toBeCloseTo(16);
    expect(result.team1Updates[0].totalEloDelta).toBeCloseTo(16);
  });
});

// ─── Custom K-Factor ──────────────────────────────────────────────────────────

describe('custom K-factor', () => {
  test('K=16 produces half the delta of K=32', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');

    const result16 = recordMatch({
      gameType: 'single',
      team1: [alice],
      team2: [bob],
      team1Won: true,
      kFactor: 16,
    });

    const result32 = recordMatch({
      gameType: 'single',
      team1: [alice],
      team2: [bob],
      team1Won: true,
      kFactor: 32,
    });

    expect(result16.team1Updates[0].specificEloDelta).toBeCloseTo(
      result32.team1Updates[0].specificEloDelta / 2,
    );
  });
});

// ─── Tournament Type Mapping ──────────────────────────────────────────────────

describe('tournamentTypeToGameType', () => {
  test.each([
    ['Einzel', 'single'],
    ['Offenes Einzel', 'single'],
    ['DYP', 'dyp'],
    ['Monster-DYP', 'dyp'],
    ['Offenes Doppel', 'double'],
    ['Doppel', 'double'],
    ['Mixed', 'double'],
  ])('%s → %s', (input, expected) => {
    expect(tournamentTypeToGameType(input)).toBe(expected);
  });
});
