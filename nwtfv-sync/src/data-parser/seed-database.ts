/**
 * seed-database.ts
 *
 * Reads local tournament and player data from data/ and seeds Supabase.
 * Run `npm run data:download` first to populate the local data folder.
 *
 * Usage:
 *   npx tsx src/data-parser/seed-database.ts                    # all local data
 *   npx tsx src/data-parser/seed-database.ts --year=2024        # specific year(s)
 *   npx tsx src/data-parser/seed-database.ts --limit=5          # limit tournaments
 *   npx tsx src/data-parser/seed-database.ts --id=123,456       # specific tournaments
 *   npx tsx src/data-parser/seed-database.ts --force            # re-seed existing
 *   npx tsx src/data-parser/seed-database.ts --skip-elo         # skip ELO recalc
 *   npx tsx src/data-parser/seed-database.ts --clean-all        # delete all rows first
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../server/prisma.js';
import { Tournament, Round } from './tournaments.js';
import { Player } from './players.js';
import { createSeedContext, seedTournament, SeedContext } from './db-inserter.js';
import { recalculateAllElos } from './elo-recalculator.js';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const yearArg = args.find(a => a.startsWith('--year='))?.split('=')[1];
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const idArg = args.find(a => a.startsWith('--id='))?.split('=')[1];
const force = args.includes('--force');
const skipElo = args.includes('--skip-elo');
const cleanAll = args.includes('--clean-all');

const yearFilter = yearArg ? yearArg.split(',').map(y => y.trim()) : undefined;
const limit = limitArg ? parseInt(limitArg, 10) : undefined;
const tournamentIds = idArg ? idArg.split(',').map(id => parseInt(id.trim(), 10)) : undefined;

// ─── Paths ────────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve('data');
const TOURNAMENTS_DIR = path.join(DATA_DIR, 'tournaments');
const PLAYERS_DIR = path.join(DATA_DIR, 'players');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countGamesInTournament(t: Tournament): number {
  const countRound = (r: Round) =>
    r.divisions.flatMap(d => d.gameStages).reduce((s, gs) => s + gs.games.length, 0);
  return countRound(t.mainRound) + (t.qualifyingRound ? countRound(t.qualifyingRound) : 0);
}

// ─── Local data readers ───────────────────────────────────────────────────────

function readLocalTournaments(): Tournament[] {
  if (!fs.existsSync(TOURNAMENTS_DIR)) {
    throw new Error(`Tournaments directory not found: ${TOURNAMENTS_DIR}\nRun npm run data:download first.`);
  }

  const allYearFiles = fs.readdirSync(TOURNAMENTS_DIR)
    .filter(f => /^\d{4}\.json$/.test(f))
    .sort(); // lexicographic = chronological for 4-digit years

  const yearFiles = yearFilter
    ? allYearFiles.filter(f => yearFilter.includes(f.replace('.json', '')))
    : allYearFiles;

  if (yearFiles.length === 0) {
    throw new Error(yearFilter
      ? `No local data found for year(s): ${yearFilter.join(', ')}`
      : `No year files found in ${TOURNAMENTS_DIR}`
    );
  }

  let tournaments: Tournament[] = [];
  for (const file of yearFiles) {
    const arr = JSON.parse(fs.readFileSync(path.join(TOURNAMENTS_DIR, file), 'utf-8')) as Tournament[];
    arr.forEach(t => { t.date = new Date(t.date); });
    console.log(`  📂 ${file}: ${arr.length} tournaments`);
    tournaments.push(...arr);
  }

  // Sort oldest-first across all years (needed for correct ELO chronology)
  tournaments.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (tournamentIds && tournamentIds.length > 0) {
    tournaments = tournaments.filter(t => tournamentIds.includes(t.id));
  }

  if (limit) {
    tournaments = tournaments.slice(0, limit);
  }

  return tournaments;
}

function makeLocalGetPlayerDetails(): (id: number) => Promise<Player | null> {
  return async (id: number): Promise<Player | null> => {
    const filePath = path.join(PLAYERS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local player file not found: ${id}.json`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Provide defaults for skeleton players (only id/name/surname present)
    return {
      id: data.id,
      name: data.name ?? '',
      surname: data.surname ?? '',
      avatarUrl: data.avatarUrl,
      category: data.category ?? '',
      clubs: data.clubs ?? [],
      organisations: data.organisations ?? [],
      nationalNumber: data.nationalNumber ?? '',
      internationalNumber: data.internationalNumber,
      rankings: data.rankings ?? [],
    };
  };
}

// ─── Seed context ─────────────────────────────────────────────────────────────

const ctx: SeedContext = createSeedContext({
  prisma,
  getPlayerDetails: makeLocalGetPlayerDetails(),
});

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏓 Seed Database (from local data)');
  console.log(`   Year:  ${yearFilter ? yearFilter.join(', ') : 'All'}`);
  console.log(`   Limit: ${limit ?? 'None'}`);
  console.log(`   IDs:   ${tournamentIds ?? 'None'}`);
  console.log(`   Force: ${force}`);
  console.log(`   Clean All: ${cleanAll}\n`);

  // 0. Clean all tables if requested
  if (cleanAll) {
    console.log('🗑  --clean-all: deleting all rows from every table...');
    await prisma.eloHistory.deleteMany({});
    await prisma.playerRanking.deleteMany({});
    await prisma.game.deleteMany({});
    await prisma.placement.deleteMany({});
    await prisma.gameStage.deleteMany({});
    await prisma.division.deleteMany({});
    await prisma.round.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.player.deleteMany({});
    console.log('   All tables cleared.\n');
  }

  // 1. Load local tournaments
  console.log('📂 Reading local tournament data...');
  const tournaments = readLocalTournaments();
  console.log(`   Loaded ${tournaments.length} tournaments.\n`);

  // 2. Force cleanup
  if (force) {
    console.log('🗑  Force mode: pre-cleaning tournaments...');
    for (const t of tournaments) {
      const existing = await prisma.tournament.findUnique({ where: { nwtfvId: t.id } });
      if (existing) {
        console.log(`   Deleting ${t.id} (${t.name})...`);
        await prisma.tournament.delete({ where: { id: existing.id } });
      }
    }

    console.log('\n🗑  Pruning orphaned skeleton players...');
    try {
      const { count } = await prisma.player.deleteMany({ where: { nwtfvId: { lt: 0 } } });
      console.log(`   Removed ${count} legacy skeleton players.\n`);
    } catch {
      console.warn('   ⚠ Could not prune all legacy players (still referenced by other tournaments).\n');
    }
  }

  // 3. Seed each tournament
  let seeded = 0;
  let skipped = 0;
  let reseeded = 0;
  const changedDates: Date[] = [];

  for (let i = 0; i < tournaments.length; i++) {
    const t = tournaments[i];
    console.log(`[${i + 1}/${tournaments.length}] ${t.name} ${t.type} — ${t.place} (${t.date.toISOString().slice(0, 10)})`);
    try {
      if (!force) {
        const alreadyExists = await prisma.tournament.findUnique({ where: { nwtfvId: t.id } });
        if (alreadyExists) {
          // Check if local data has more/fewer games than what's in DB
          const localGameCount = countGamesInTournament(t);
          const dbGameCount = await prisma.game.count({ where: { tournamentId: alreadyExists.id } });
          if (localGameCount !== dbGameCount) {
            console.log(`  🔄 Game count changed (local: ${localGameCount}, db: ${dbGameCount}) — re-seeding...\n`);
            await prisma.tournament.delete({ where: { id: alreadyExists.id } });
            await seedTournament(ctx, t, {});
            changedDates.push(t.date);
            reseeded++;
            console.log(`  ✅ Done\n`);
          } else {
            console.log(`  ⏩ Already seeded, skipping.\n`);
            skipped++;
          }
          continue;
        }
      }
      await seedTournament(ctx, t, { force });
      seeded++;
      console.log(`  ✅ Done\n`);
    } catch (err) {
      console.error(`  ❌ Error seeding ${t.id}:`, err instanceof Error ? err.message : err);
      console.log('');
    }
  }

  // 4. ELO recalculation
  if (!skipElo) {
    let fromDate: Date | undefined;
    if (!force && changedDates.length > 0) {
      fromDate = changedDates.sort((a, b) => a.getTime() - b.getTime())[0];
      console.log(`🔄 Partial ELO recalculation from ${fromDate.toISOString().slice(0, 10)} (earliest changed tournament)\n`);
    }
    await recalculateAllElos({ prisma, fromDate });
  } else {
    console.log('⏩ Skipping ELO recalculation\n');
  }

  // 5. Summary
  console.log(`\n─── Summary ───`);
  console.log(`  Total loaded:    ${tournaments.length}`);
  console.log(`  Seeded:          ${seeded}`);
  console.log(`  Re-seeded:       ${reseeded}`);
  console.log(`  Skipped (dupes): ${skipped}`);
  console.log(`  Players cached:  ${ctx.playerIdCache.size + ctx.playerNameCache.size}`);
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
