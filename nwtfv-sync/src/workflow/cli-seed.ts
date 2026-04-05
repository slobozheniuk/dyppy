// cli-seed.ts
import { makeDataPaths, ensureDataDirs } from '../transform/local-store.js';
import { uploadAndRecalculate } from './update.js';
import { prisma } from '../server/prisma.js';
import path from 'path';

const args = process.argv.slice(2);
const force = args.includes('--force');
const skipElo = args.includes('--skip-elo');
const cleanAll = args.includes('--clean-all');

async function main() {
  console.log('\n🏓 Seed Database (from local data)');
  
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

  const dataPaths = makeDataPaths(path.resolve('data'));
  
  await uploadAndRecalculate({
    dataPaths,
    prisma,
    force,
    skipElo,
    log: true
  });

  console.log('\n✅ Seed completed.');
}

main()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
