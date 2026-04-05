import { prisma as defaultPrisma } from '../server/prisma.js';
import { getPlayerDetails as defaultGetPlayerDetails, Player as FullPlayer } from '../fetch/players.js';
import { Tournament, Round, Competitor } from '../fetch/tournaments.js';
import { SkillLevel as PrismaSkillLevel, RoundType as PrismaRoundType } from '../generated/prisma/client.js';

// ─── getHashedId (internal) ───────────────────────────────────────────────────

/**
 * Generates a stable hashed ID for a player name in range 10000000-99999999.
 */
function getHashedId(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return 10000000 + (Math.abs(hash) % 90000000);
}

// ─── SeedContext ──────────────────────────────────────────────────────────────

export interface SeedContext {
  prisma: any;
  playerIdCache: Map<number, string>;
  playerNameCache: Map<string, string>;
  failedPlayerFetches: Set<number>;
  getPlayerDetails: (id: number) => Promise<FullPlayer | null>;
  log?: boolean;
}

export function createSeedContext(overrides?: Partial<SeedContext>): SeedContext {
  return {
    prisma: defaultPrisma,
    playerIdCache: new Map(),
    playerNameCache: new Map(),
    failedPlayerFetches: new Set(),
    getPlayerDetails: defaultGetPlayerDetails,
    log: true,
    ...overrides,
  };
}

// ─── Player resolution ────────────────────────────────────────────────────────

/**
 * Ensures a player exists in the database (upserts) and returns its Prisma id.
 */
export async function ensurePlayer(ctx: SeedContext, parsedPlayer: { name: string; nwtfvId?: number }): Promise<string> {
  if (parsedPlayer.nwtfvId && ctx.playerIdCache.has(parsedPlayer.nwtfvId)) {
    return ctx.playerIdCache.get(parsedPlayer.nwtfvId)!;
  }
  if (!parsedPlayer.nwtfvId && ctx.playerNameCache.has(parsedPlayer.name)) {
    return ctx.playerNameCache.get(parsedPlayer.name)!;
  }

  if (parsedPlayer.nwtfvId) {
    const existing = await ctx.prisma.player.findUnique({ where: { nwtfvId: parsedPlayer.nwtfvId } });
    if (existing) {
      ctx.playerIdCache.set(parsedPlayer.nwtfvId, existing.id);
      return existing.id;
    }

    let fullPlayer: FullPlayer | null = null;
    if (!ctx.failedPlayerFetches.has(parsedPlayer.nwtfvId)) {
      try {
        fullPlayer = await ctx.getPlayerDetails(parsedPlayer.nwtfvId);
      } catch (err) {
        if (ctx.log) console.warn(`    ⚠ Could not fetch profile for nwtfvId=${parsedPlayer.nwtfvId} (${parsedPlayer.name}), creating skeleton.`);
        ctx.failedPlayerFetches.add(parsedPlayer.nwtfvId);
      }
    }

    if (fullPlayer) {
      const dbPlayer = await ctx.prisma.player.create({
        data: {
          nwtfvId: fullPlayer.id,
          name: fullPlayer.name,
          surname: fullPlayer.surname,
          avatarUrl: fullPlayer.avatarUrl || null,
          category: fullPlayer.category,
          clubs: fullPlayer.clubs,
          organisations: fullPlayer.organisations,
          nationalNumber: fullPlayer.nationalNumber,
          internationalNumber: fullPlayer.internationalNumber || null,
          rankings: {
            create: fullPlayer.rankings.map(r => ({
              name: r.name,
              year: r.year,
              rank: r.rank,
              totalRankedPlayers: r.totalRankedPlayers,
            })),
          },
        },
      });
      ctx.playerIdCache.set(parsedPlayer.nwtfvId, dbPlayer.id);
      if (ctx.log) console.log(`    ✓ Player: ${fullPlayer.surname}, ${fullPlayer.name} (${parsedPlayer.nwtfvId})`);
      return dbPlayer.id;
    }

    const [surname, firstName] = parsedPlayer.name.split(',').map(s => s.trim());
    const skeleton = await ctx.prisma.player.create({
      data: {
        nwtfvId: parsedPlayer.nwtfvId,
        name: firstName || '',
        surname: surname || '',
        category: '',
        clubs: [],
        organisations: [],
        nationalNumber: '',
      },
    });
    ctx.playerIdCache.set(parsedPlayer.nwtfvId, skeleton.id);
    return skeleton.id;
  }

  // No nwtfvId — create skeleton with hashed id
  const [surname, firstName] = parsedPlayer.name.split(',').map(s => s.trim());
  const hashedId = getHashedId(parsedPlayer.name);

  const existingHashed = await ctx.prisma.player.findUnique({ where: { nwtfvId: hashedId } });
  if (existingHashed) {
    ctx.playerNameCache.set(parsedPlayer.name, existingHashed.id);
    return existingHashed.id;
  }

  const skeleton = await ctx.prisma.player.create({
    data: {
      nwtfvId: hashedId,
      name: firstName || parsedPlayer.name,
      surname: surname || '',
      category: '',
      clubs: [],
      organisations: [],
      nationalNumber: '',
    },
  });
  ctx.playerNameCache.set(parsedPlayer.name, skeleton.id);
  if (ctx.log) console.log(`    ○ Skeleton player (hashed): ${parsedPlayer.name} (${hashedId})`);
  return skeleton.id;
}

/**
 * Resolves a Competitor union type to flat player IDs.
 */
export async function resolveCompetitor(ctx: SeedContext, comp: Competitor): Promise<{ p1Id: string; p2Id: string | null }> {
  if (comp.type === 'player') {
    return { p1Id: await ensurePlayer(ctx, comp.player), p2Id: null };
  }
  return {
    p1Id: await ensurePlayer(ctx, comp.player1),
    p2Id: await ensurePlayer(ctx, comp.player2),
  };
}

// ─── Tournament seeding ───────────────────────────────────────────────────────

/**
 * Seeds a single parsed tournament into the database.
 */
export async function seedTournament(ctx: SeedContext, t: Tournament, options: { force?: boolean } = {}): Promise<void> {
  const existing = await ctx.prisma.tournament.findUnique({ where: { nwtfvId: t.id } });
  if (existing) {
    if (options.force) {
      if (ctx.log) console.log(`  🗑  Force re-seeding: Deleting existing tournament ${t.id}...`);
      await ctx.prisma.tournament.delete({ where: { id: existing.id } });
    } else {
      if (ctx.log) console.log(`  ⏩ Skipping tournament ${t.id} (${t.name}) — already in DB.`);
      return;
    }
  }

  const dbTournament = await ctx.prisma.tournament.create({
    data: {
      nwtfvId: t.id,
      tournamentGroupID: t.tournamentGroupID,
      date: t.date,
      name: t.name,
      type: t.type,
      place: t.place,
      numberOfParticipants: t.numberOfParticipants ?? null,
    },
  });

  await seedRound(ctx, dbTournament.id, t.mainRound, 'Main');

  if (t.qualifyingRound) {
    await seedRound(ctx, dbTournament.id, t.qualifyingRound, 'Qualifying');
  }
}

/**
 * Seeds a single round (Main or Qualifying) for a tournament.
 */
export async function seedRound(ctx: SeedContext, tournamentId: string, round: Round, type: 'Main' | 'Qualifying'): Promise<void> {
  const dbRound = await ctx.prisma.round.create({
    data: { tournamentId, type: type as PrismaRoundType },
  });

  const placementsData = [];
  for (const placement of round.finalPlacements) {
    const { p1Id, p2Id } = await resolveCompetitor(ctx, placement.competitor);
    placementsData.push({
      roundId: dbRound.id,
      rank: placement.rank,
      player1Id: p1Id,
      player2Id: p2Id,
    });
  }
  if (placementsData.length > 0) {
    await ctx.prisma.placement.createMany({ data: placementsData });
  }

  for (const division of round.divisions) {
    const dbDivision = await ctx.prisma.division.create({
      data: {
        roundId: dbRound.id,
        skillLevel: division.skillLevel as PrismaSkillLevel,
      },
    });

    for (const stage of division.gameStages) {
      const dbStage = await ctx.prisma.gameStage.create({
        data: { divisionId: dbDivision.id, name: stage.name },
      });

      const gamesData = [];
      for (const game of stage.games) {
        const t1 = await resolveCompetitor(ctx, game.competitor1);
        const t2 = await resolveCompetitor(ctx, game.competitor2);

        gamesData.push({
          tournamentId,
          roundId: dbRound.id,
          divisionId: dbDivision.id,
          gameStageId: dbStage.id,
          t1Player1Id: t1.p1Id,
          t1Player2Id: t1.p2Id,
          t2Player1Id: t2.p1Id,
          t2Player2Id: t2.p2Id,
          scores: game.scores,
        });
      }

      if (gamesData.length > 0) {
        await ctx.prisma.game.createMany({ data: gamesData });
      }
    }
  }
}
