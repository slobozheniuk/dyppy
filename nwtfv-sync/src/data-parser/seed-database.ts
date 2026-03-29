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
 *   npx tsx src/data-parser/seed-database.ts --id=123,456       # specific tournaments
 *   npx tsx src/data-parser/seed-database.ts --year=2024 --limit=50
 */

import { prisma } from '../server/prisma.js';
import { getTournaments, Tournament } from './tournaments.js';
import { updateEloForExistingGame } from '../server/elo-transaction.js';
import { createSeedContext, seedTournament, SeedContext } from './db-inserter.js';
import { recalculateAllElos } from './elo-recalculator.js';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const yearArg = args.find(a => a.startsWith('--year='))?.split('=')[1];
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const idArg = args.find(a => a.startsWith('--id='))?.split('=')[1];
const force = args.includes('--force');
const skipElo = args.includes('--skip-elo');

const year = yearArg ? yearArg.split(',') : undefined;
const limit = limitArg ? parseInt(limitArg, 10) : undefined;
const tournamentIds = idArg ? idArg.split(',').map(id => parseInt(id.trim(), 10)) : undefined;

// Initialize seeding context
const ctx: SeedContext = createSeedContext({ prisma });

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏓 Seed Database`);
  console.log(`   Year:  ${year ?? 'Current season'}`);
  console.log(`   Limit: ${limit ?? 'None'}`);
  console.log(`   IDs:   ${tournamentIds ?? 'None'}\n`);

  // 1. Parse tournaments from nwtfv.com
  console.log('📡 Fetching tournaments from nwtfv.com...');
  const tournaments = (await getTournaments({ limit, year, tournamentIds })).reverse();
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
      await seedTournament(ctx, t, { force });
      seeded++;
      console.log(`  ✅ Done\n`);
    } catch (err) {
      console.error(`  ❌ Error seeding tournament ${t.id}:`, err instanceof Error ? err.message : err);
      console.log('');
    }
  }

  // 4. ELO recalculation
  if (!skipElo) {
    await recalculateAllElos({ prisma });
  } else {
    console.log('⏩ Skipping ELO recalculation (--skip-elo flag)\n');
  }

  // 5. Summary
  console.log(`\n─── Summary ───`);
  console.log(`  Total parsed:    ${tournaments.length}`);
  console.log(`  Seeded:          ${seeded}`);
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
