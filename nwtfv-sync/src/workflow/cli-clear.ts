import { prisma } from '../server/prisma.js';
import { recalculateAllElos } from '../upload/elo-recalculator.js';

const args = process.argv.slice(2);

let year: string | undefined = undefined;
if (args.length > 0 && !isNaN(Number(args[0]))) {
  year = args[0];
}

async function main() {
  if (!year) {
    console.error('❌ Please provide a year to clear. Example: npm run data:clear 2010');
    process.exit(1);
  }

  console.log(`\n🚀 Starting Data Clear for year ${year}`);

  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`);

  const tournaments = await prisma.tournament.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate
      }
    },
    select: { id: true }
  });

  if (tournaments.length === 0) {
    console.log(`\n✅ No tournaments found in the database for the year ${year}.`);
    return;
  }

  console.log(`\n🗑️  Found ${tournaments.length} tournaments for ${year}. Deleting...`);
  
  const tournamentIds = tournaments.map(t => t.id);

  // Prisma cascading will delete Round, Division, GameStage, Game, Placement.
  await prisma.tournament.deleteMany({
    where: {
      id: { in: tournamentIds }
    }
  });

  console.log(`✅ Deleted ${tournaments.length} tournaments and their associated data.`);

  // Recalculate ELO. Passing fromDate as startDate will drop all EloHistory on/after startDate,
  // effectively clearing out the EloHistory for the deleted games, and recalculating remaining games.
  console.log(`\n🔄 Recalculating ELO from ${year}...`);
  await recalculateAllElos({ prisma, fromDate: startDate, log: true });

  console.log(`\n🎉 Data for year ${year} has been successfully cleared and ELO recalculated.`);
}

main()
  .catch(err => {
    console.error('\n❌ Data clear failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
