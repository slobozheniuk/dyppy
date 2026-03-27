/**
 * seed-database.ts
 * 
 * Parses tournament + player data from nwtfv.com and inserts it
 * into the Supabase PostgreSQL database via Prisma.
 *
 * Usage:
 *   npx tsx src/data-parser/seed-database.ts                    # current season, 20 tournaments
 *   npx tsx src/data-parser/seed-database.ts --year=2024        # specific season
 *   npx tsx src/data-parser/seed-database.ts --limit=5          # limit number of tournaments
 *   npx tsx src/data-parser/seed-database.ts --year=2024 --limit=50
 */

import { prisma } from '../server/prisma.js';
import { getTournaments, Tournament, Round, Competitor, Game as ParsedGame, Division } from './tournaments.js';
import { getPlayerDetails, Player as FullPlayer } from './players.js';
import { SkillLevel as PrismaSkillLevel, RoundType as PrismaRoundType } from '../generated/prisma/client.js';
import { updateEloForExistingGame } from '../server/elo-transaction.js';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const yearArg = args.find(a => a.startsWith('--year='))?.split('=')[1];
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const force = args.includes('--force');
const skipElo = args.includes('--skip-elo');

const year = yearArg ? parseInt(yearArg, 10) : undefined;
const limit = limitArg ? parseInt(limitArg, 10) : undefined;

// ─── Player cache ─────────────────────────────────────────────────────────────
// Maps nwtfvId → Prisma Player.id (cuid)
const playerIdCache = new Map<number, string>();
// For players with no nwtfvId, use  "Surname, Name" → cuid
const playerNameCache = new Map<string, string>();

// Track players we've already tried (and failed) to fetch profiles for
const failedPlayerFetches = new Set<number>();

/**
 * Generates a stable hashed ID for a player name in range 10000000-99999999.
 */
function getHashedId(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return 10000000 + (Math.abs(hash) % 90000000);
}

/**
 * Ensures a player exists in the database (upserts) and returns its Prisma id.
 * If the player has an nwtfvId we fetch the full profile from nwtfv.com.
 * Otherwise we create a skeleton record.
 */
async function ensurePlayer(parsedPlayer: { name: string; nwtfvId?: number }): Promise<string> {
  // 1. Check cache first
  if (parsedPlayer.nwtfvId && playerIdCache.has(parsedPlayer.nwtfvId)) {
    return playerIdCache.get(parsedPlayer.nwtfvId)!;
  }
  if (!parsedPlayer.nwtfvId && playerNameCache.has(parsedPlayer.name)) {
    return playerNameCache.get(parsedPlayer.name)!;
  }

  // 2. If we have an nwtfvId, try to fetch full profile + upsert
  if (parsedPlayer.nwtfvId) {
    // Check if already in the DB
    const existing = await prisma.player.findUnique({ where: { nwtfvId: parsedPlayer.nwtfvId } });
    if (existing) {
      playerIdCache.set(parsedPlayer.nwtfvId, existing.id);
      return existing.id;
    }

    // Fetch full profile from nwtfv.com
    let fullPlayer: FullPlayer | null = null;
    if (!failedPlayerFetches.has(parsedPlayer.nwtfvId)) {
      try {
        fullPlayer = await getPlayerDetails(parsedPlayer.nwtfvId);
      } catch {
        console.warn(`    ⚠ Could not fetch profile for nwtfvId=${parsedPlayer.nwtfvId} (${parsedPlayer.name}), creating skeleton.`);
        failedPlayerFetches.add(parsedPlayer.nwtfvId);
      }
    }

    if (fullPlayer) {
      const dbPlayer = await prisma.player.create({
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
      playerIdCache.set(parsedPlayer.nwtfvId, dbPlayer.id);
      console.log(`    ✓ Player: ${fullPlayer.surname}, ${fullPlayer.name} (${parsedPlayer.nwtfvId})`);
      return dbPlayer.id;
    }

    // Fallback skeleton for players whose profile fetch failed
    const [surname, firstName] = parsedPlayer.name.split(',').map(s => s.trim());
    const skeleton = await prisma.player.create({
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
    playerIdCache.set(parsedPlayer.nwtfvId, skeleton.id);
    return skeleton.id;
  }

  // 3. No nwtfvId — create skeleton with hashed id
  const [surname, firstName] = parsedPlayer.name.split(',').map(s => s.trim());
  const hashedId = getHashedId(parsedPlayer.name);

  // Check if hashed ID already exists
  const existingHashed = await prisma.player.findUnique({ where: { nwtfvId: hashedId } });
  if (existingHashed) {
    playerNameCache.set(parsedPlayer.name, existingHashed.id);
    return existingHashed.id;
  }

  const skeleton = await prisma.player.create({
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
  playerNameCache.set(parsedPlayer.name, skeleton.id);
  console.log(`    ○ Skeleton player (hashed): ${parsedPlayer.name} (${hashedId})`);
  return skeleton.id;
}

/**
 * Resolves a Competitor union type to flat player IDs.
 */
async function resolveCompetitor(comp: Competitor): Promise<{ p1Id: string; p2Id: string | null }> {
  if (comp.type === 'player') {
    return { p1Id: await ensurePlayer(comp.player), p2Id: null };
  }
  return {
    p1Id: await ensurePlayer(comp.player1),
    p2Id: await ensurePlayer(comp.player2),
  };
}

/**
 * Seeds a single parsed tournament into the database.
 */
async function seedTournament(t: Tournament): Promise<void> {
  // Check if already seeded
  const existing = await prisma.tournament.findUnique({ where: { nwtfvId: t.id } });
  if (existing) {
    if (force) {
      console.log(`  🗑  Force re-seeding: Deleting existing tournament ${t.id}...`);
      await prisma.tournament.delete({ where: { id: existing.id } });
    } else {
      console.log(`  ⏩ Skipping tournament ${t.id} (${t.name}) — already in DB.`);
      return;
    }
  }

  // Create the tournament
  const dbTournament = await prisma.tournament.create({
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

  // Seed main round
  await seedRound(dbTournament.id, t.mainRound, 'Main');

  // Seed qualifying round (if any)
  if (t.qualifyingRound) {
    await seedRound(dbTournament.id, t.qualifyingRound, 'Qualifying');
  }
}

/**
 * Seeds a single round (Main or Qualifying) for a tournament.
 */
async function seedRound(tournamentId: string, round: Round, type: 'Main' | 'Qualifying'): Promise<void> {
  const dbRound = await prisma.round.create({
    data: {
      tournamentId,
      type: type as PrismaRoundType,
    },
  });

  // Seed placements
  for (const placement of round.finalPlacements) {
    const { p1Id, p2Id } = await resolveCompetitor(placement.competitor);
    await prisma.placement.create({
      data: {
        roundId: dbRound.id,
        rank: placement.rank,
        player1Id: p1Id,
        player2Id: p2Id,
      },
    });
  }

  // Seed divisions → gameStages → games
  for (const division of round.divisions) {
    const dbDivision = await prisma.division.create({
      data: {
        roundId: dbRound.id,
        skillLevel: division.skillLevel as PrismaSkillLevel,
      },
    });

    for (const stage of division.gameStages) {
      const dbStage = await prisma.gameStage.create({
        data: {
          divisionId: dbDivision.id,
          name: stage.name,
        },
      });

      for (const game of stage.games) {
        const t1 = await resolveCompetitor(game.competitor1);
        const t2 = await resolveCompetitor(game.competitor2);

        await prisma.game.create({
          data: {
            tournamentId,
            roundId: dbRound.id,
            divisionId: dbDivision.id,
            gameStageId: dbStage.id,
            t1Player1Id: t1.p1Id,
            t1Player2Id: t1.p2Id,
            t2Player1Id: t2.p1Id,
            t2Player2Id: t2.p2Id,
            scores: game.scores,
          },
        });
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏓 Seed Database`);
  console.log(`   Year:  ${year ?? 'Current season'}`);
  console.log(`   Limit: ${limit}\n`);

  // 1. Parse tournaments from nwtfv.com
  console.log('📡 Fetching tournaments from nwtfv.com...');
  const tournaments = await getTournaments({ limit, year });
  console.log(`   Found ${tournaments.length} tournaments to seed.\n`);

  // 2. Initial cleanup if force is enabled
  if (force) {
    console.log('🗑  Force mode enabled: Pre-cleaning specific tournaments...');
    for (const t of tournaments) {
      const existing = await prisma.tournament.findUnique({ where: { nwtfvId: t.id } });
      if (existing) {
        console.log(`   Deleting existing tournament ${t.id} (${t.name})...`);
        await prisma.tournament.delete({ where: { id: existing.id } });
      }
    }
    
    console.log('\n🗑  Pruning orphaned legacy skeleton players (negative nwtfvIds)...');
    try {
      // We try to delete all negative IDs. Some might fail if referenced by tournaments NOT in the current limit.
      const { count } = await prisma.player.deleteMany({ where: { nwtfvId: { lt: 0 } } });
      console.log(`   Removed ${count} legacy skeleton players.\n`);
    } catch (err) {
      console.warn('   ⚠ Could not prune all legacy players (still referenced by other tournaments). They will be ignored.\n');
    }
  }

  // 3. Seed each tournament
  let seeded = 0;
  let skipped = 0;
  for (let i = 0; i < tournaments.length; i++) {
    const t = tournaments[i];
    console.log(`[${i + 1}/${tournaments.length}] ${t.name} ${t.type} — ${t.place} (${t.date})`);
    try {
      // Tournament was already deleted in pre-cleanup if force was enabled
      if (!force) {
        const alreadyExists = await prisma.tournament.findUnique({ where: { nwtfvId: t.id } });
        if (alreadyExists) {
          console.log(`  ⏩ Already seeded, skipping.\n`);
          skipped++;
          continue;
        }
      }
      await seedTournament(t);
      seeded++;
      console.log(`  ✅ Done\n`);
    } catch (err) {
      console.error(`  ❌ Error seeding tournament ${t.id}:`, err instanceof Error ? err.message : err);
      console.log('');
    }
  }

  // 4. ELO recalculation
  if (!skipElo) {
    console.log('📊 Recalculating ELO ratings for all games...\n');

    // Reset all player ELOs to 1500
    await prisma.player.updateMany({
      data: { singleElo: 1500, doubleElo: 1500, dypElo: 1500, totalElo: 1500 },
    });

    // Clear existing ELO history
    await prisma.eloHistory.deleteMany({});

    // Fetch all games with their tournament type, ordered chronologically
    const allGames = await prisma.game.findMany({
      include: {
        tournament: { select: { type: true, date: true } },
      },
    });

    // Sort by tournament date (DD.MM.YYYY format) then by createdAt
    allGames.sort((a, b) => {
      const parseDate = (d: string) => {
        const [day, month, yearStr] = d.split('.');
        return new Date(`${yearStr}-${month}-${day}`).getTime();
      };
      const dateDiff = parseDate(a.tournament.date) - parseDate(b.tournament.date);
      if (dateDiff !== 0) return dateDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    let eloProcessed = 0;
    let eloErrors = 0;
    for (let i = 0; i < allGames.length; i++) {
      const game = allGames[i];
      try {
        const [day, month, yearStr] = game.tournament.date.split('.');
        const gameDate = new Date(`${yearStr}-${month}-${day}`);

        await updateEloForExistingGame({
          gameId: game.id,
          t1Player1Id: game.t1Player1Id,
          t1Player2Id: game.t1Player2Id ?? undefined,
          t2Player1Id: game.t2Player1Id,
          t2Player2Id: game.t2Player2Id ?? undefined,
          scores: game.scores as { score1: number; score2: number }[],
          tournamentType: game.tournament.type,
          gameDate,
        });
        eloProcessed++;

        if ((i + 1) % 50 === 0 || i === allGames.length - 1) {
          console.log(`   ELO progress: ${i + 1}/${allGames.length} games processed`);
        }
      } catch (err) {
        eloErrors++;
        if (eloErrors <= 5) {
          console.error(`   ⚠ ELO error for game ${game.id}:`, err instanceof Error ? err.message : err);
        }
      }
    }

    console.log(`\n   ELO processed: ${eloProcessed} games (${eloErrors} errors)\n`);
  } else {
    console.log('⏩ Skipping ELO recalculation (--skip-elo flag)\n');
  }

  // 5. Summary
  console.log(`\n─── Summary ───`);
  console.log(`  Total parsed:    ${tournaments.length}`);
  console.log(`  Seeded:          ${seeded}`);
  console.log(`  Skipped (dupes): ${skipped}`);
  console.log(`  Players cached:  ${playerIdCache.size + playerNameCache.size}`);
  console.log(`  ELO calculated:  ${skipElo ? 'skipped' : 'yes'}`);
  console.log(`  Done! 🎉\n`);
}

main()
  .catch(err => {
    console.error('❌ Seed script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
