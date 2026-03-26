import fs from 'node:fs';
import path from 'node:path';
import { getTournaments, Tournament, Round } from './tournaments.js';
import { getPlayerDetails, Player as FullPlayer } from './players.js';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const TOURNAMENTS_FILE = path.join(DATA_DIR, 'tournaments.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

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

  // 3. Extract and export unique players
  console.log('--- Exporting Players ---');
  const finalPlayers: FullPlayer[] = [];
  const idSet = new Set<number>();
  const nameSet = new Set<string>();

  const extractedPlayers: { name: string, nwtfvId?: number }[] = [];
  
  const processCompetitor = (comp: any) => {
    if (!comp) return;
    if (comp.type === 'player') {
      extractedPlayers.push(comp.player);
    } else if (comp.type === 'team') {
      extractedPlayers.push(comp.player1);
      extractedPlayers.push(comp.player2);
    }
  };

  // 3a. Extract from tournament placements
  for (const t of tournaments) {
    const processRoundPlacements = (round: Round | undefined) => {
      if (!round) return;
      for (const placement of round.finalPlacements) {
        processCompetitor(placement.competitor);
      }
    };
    processRoundPlacements(t.mainRound);
    processRoundPlacements(t.qualifyingRound);
  }

  // 3b. Extract from games
  for (const game of allGames) {
    processCompetitor(game.competitor1);
    processCompetitor(game.competitor2);
  }

  for (const p of extractedPlayers) {
    if (p.nwtfvId && p.nwtfvId > 0) {
      if (idSet.has(p.nwtfvId)) continue;
      
      try {
        const full = await getPlayerDetails(p.nwtfvId);
        finalPlayers.push(full);
        idSet.add(p.nwtfvId);
        // Also add name in "Surname, Name" format to nameSet to prevent redundant skeleton creation
        nameSet.add(`${full.surname}, ${full.name}`);
        console.log(`  Fetched profile for: ${full.surname}, ${full.name} (${p.nwtfvId})`);
      } catch (error) {
        console.warn(`  Failed to fetch profile for ID ${p.nwtfvId}, creating skeleton:`, error instanceof Error ? error.message : error);
        // Fallback to skeleton if fetch fails
        if (!nameSet.has(p.name)) {
          const [surname, firstName] = p.name.split(',').map(s => s.trim());
          finalPlayers.push({
            id: p.nwtfvId,
            name: firstName || '',
            surname: surname || '',
            category: '',
            clubs: [],
            organisations: [],
            nationalNumber: '',
            rankings: []
          });
          nameSet.add(p.name);
          idSet.add(p.nwtfvId);
        }
      }
    } else {
      if (nameSet.has(p.name)) continue;
      const [surname, firstName] = p.name.split(',').map(s => s.trim());
      finalPlayers.push({
        id: 0,
        name: firstName || '',
        surname: surname || '',
        category: '',
        clubs: [],
        organisations: [],
        nationalNumber: '',
        rankings: []
      });
      nameSet.add(p.name);
      console.log(`  Added skeleton for: ${p.name}`);
    }
  }

  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(finalPlayers, null, 2));

  console.log(`--- Export Complete ---`);
  console.log(`Saved ${tournamentDataOnly.length} tournaments to ${TOURNAMENTS_FILE}`);
  console.log(`Saved ${allGames.length} games to ${GAMES_FILE}`);
  console.log(`Saved ${finalPlayers.length} unique players to ${PLAYERS_FILE}`);
}

exportData().catch(err => {
  console.error('Export script failed:', err);
  process.exit(1);
});
