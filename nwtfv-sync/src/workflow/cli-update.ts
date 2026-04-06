// cli-update.ts
import { makeDataPaths, ensureDataDirs } from '../transform/local-store.js';
import { runDataUpdate } from './update.js';
import { prisma } from '../server/prisma.js';
import path from 'path';

const args = process.argv.slice(2);
const force = args.includes('--force');
const skipElo = args.includes('--skip-elo');

let year: string | undefined = undefined;
const yearIdx = args.indexOf('--year');
if (yearIdx !== -1 && args[yearIdx + 1]) {
  year = args[yearIdx + 1];
}

async function main() {
  console.log('\n🚀 Starting Full Data Update');
  
  const dataPaths = makeDataPaths(path.resolve('data'));
  ensureDataDirs(dataPaths);
  
  const result = await runDataUpdate({
    prisma,
    dataPaths,
    year,
    force,
    skipElo,
    log: true
  });

  console.log(`\n─── Update Summary ───`);
  console.log(`  Years Processed:        ${result.yearsProcessed.join(', ') || 'None'}`);
  console.log(`  Tournaments Downloaded: ${result.tournamentsDownloaded}`);
  console.log(`  Players Downloaded:     ${result.playersDownloaded}`);
  console.log(`  References Patched:     ${result.referencesPatched}`);
  console.log(`  Tournaments Upserted:   ${result.tournamentsUpserted}`);
  console.log(`  ELO from Date:          ${result.eloFromDate ? result.eloFromDate.toISOString() : 'N/A'}`);
  console.log(`\n✅ Data update completed successfully.`);
}

main()
  .catch(err => {
    console.error('❌ Data update failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
