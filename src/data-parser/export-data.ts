import fs from 'node:fs';
import path from 'node:path';
import { getTournaments, Tournament, Round, Game } from './tournaments.js';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const TOURNAMENTS_FILE = path.join(DATA_DIR, 'tournaments.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');

async function exportData() {
  console.log('--- Starting Data Export (Limit: 20) ---');
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let tournaments: Tournament[] = [];
  try {
    // We fetch them one by one in getTournaments, let's just use it.
    // However, if one fails, getTournaments throws. 
    // To be robust, let's manually fetch the list and then get details with individual try/catch.
    tournaments = await getTournaments({ limit: 20 });
  } catch (error) {
    console.warn('Some tournaments might have failed to parse, continuing with what we have if possible.');
  }

  if (tournaments.length === 0) {
    console.error('No tournaments were successfully parsed.');
    return;
  }

  const tournamentDataOnly: any[] = [];
  const allGames: any[] = [];

  for (const t of tournaments) {
    // 1. Process tournament data without games
    const tournamentCopy = JSON.parse(JSON.stringify(t));
    
    const stripGames = (round: Round | undefined) => {
      if (!round) return;
      for (const division of round.divisions) {
        for (const stage of division.gameStages) {
          stage.games = []; // Remove games
        }
      }
    };

    stripGames(tournamentCopy.mainRound);
    stripGames(tournamentCopy.qualifyingRound);
    tournamentDataOnly.push(tournamentCopy);

    // 2. Extract games
    const extractGamesFromRound = (round: Round | undefined) => {
      if (!round) return;
      for (const division of round.divisions) {
        for (const stage of division.gameStages) {
          for (const game of stage.games) {
            allGames.push({
              ...game,
              tournamentId: t.id,
              skillLevel: division.skillLevel,
              stageName: stage.name
            });
          }
        }
      }
    };

    extractGamesFromRound(t.mainRound);
    extractGamesFromRound(t.qualifyingRound);
  }

  fs.writeFileSync(TOURNAMENTS_FILE, JSON.stringify(tournamentDataOnly, null, 2));
  fs.writeFileSync(GAMES_FILE, JSON.stringify(allGames, null, 2));

  console.log(`--- Export Complete ---`);
  console.log(`Saved ${tournamentDataOnly.length} tournaments to ${TOURNAMENTS_FILE}`);
  console.log(`Saved ${allGames.length} games to ${GAMES_FILE}`);
}

exportData().catch(err => {
  console.error('Export script failed:', err);
  process.exit(1);
});
