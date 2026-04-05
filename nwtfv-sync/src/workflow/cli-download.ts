// cli-download.ts
import { makeDataPaths, ensureDataDirs } from '../transform/local-store.js';
import { downloadTournamentsFromDate, downloadPlayersForDateRange, reconcileLocalData } from './update.js';
import path from 'path';

const args = process.argv.slice(2);
const yearArg = args.find(a => a.startsWith('--year='))?.split('=')[1];
const force = args.includes('--force');

async function main() {
  console.log('\n📥 Download Local Data');
  
  const dataPaths = makeDataPaths(path.resolve('data'));
  ensureDataDirs(dataPaths);
  
  // Actually downloadTournamentsFromDate uses a cutoffDate.
  // If yearArg is given, let's just make cutoffDate to January 1 of that year, 
  // but wait! `downloadTournamentsFromDate` uses `cutoffDate` for filtering and fetches ONLY >= cutoffDate.
  // We can convert yearArg into a date.
  let cutoffDate = null;
  if (yearArg) {
    const yearNumber = parseInt(yearArg.split(',')[0], 10);
    cutoffDate = new Date(`${yearNumber}-01-01`);
  }
  
  await downloadTournamentsFromDate({
    dataPaths,
    cutoffDate: force ? null : cutoffDate,
    force,
    log: true
  });
  
  await downloadPlayersForDateRange({
    dataPaths,
    fromDate: cutoffDate,
    force,
    log: true
  });
  
  await reconcileLocalData({
    dataPaths,
    log: true
  });
  
  console.log('\n✅ Download completed.');
}

main().catch(err => {
  console.error('❌ Download failed:', err);
  process.exit(1);
});
