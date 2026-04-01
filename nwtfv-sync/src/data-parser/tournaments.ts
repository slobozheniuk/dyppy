import pLimit from 'p-limit';
import * as cheerio from 'cheerio';

export type SkillLevel = 'Pro' | 'Amateur' | 'Open';
export type Player = {
  name: string;
  nwtfvId?: number;
}

export type Competitor =
  | { type: 'player'; player: Player }
  | { type: 'team'; player1: Player; player2: Player }

export type Game = {
  competitor1: Competitor;
  competitor2: Competitor;
  scores: { score1: number; score2: number }[];
}

export type GameStage = {
  name: string;
  games: Game[];
}

export type Placement = {
  rank: number;
  competitor: Competitor;
}

export type Division = {
  skillLevel: SkillLevel;
  gameStages: GameStage[];
}

export type Tournament = {
  id: number;
  tournamentGroupID: number;
  date: string;
  name: string;
  type: string;
  place: string;
  numberOfParticipants?: number | null;
  mainRound: Round;
  qualifyingRound?: Round;
}

export type Round = {
  finalPlacements: Placement[];
  divisions: Division[];
}

export async function getTournaments({ limit, tournamentIds, year, withoutDetails }: { limit?: number, tournamentIds?: number[], year?: (number | string)[], withoutDetails?: boolean } = {}): Promise<Tournament[]> {
  const tournaments: Tournament[] = [];
  const url = `https://nwtfv.com/turniere?format=json`;

  let tournamentIdsList: number[] = [];
  const yearsToProcess = year && year.length > 0 ? year : [undefined];

  for (const y of yearsToProcess) {
    let tournamentsRes = await fetch(url);
    let tournamentsHTML = await tournamentsRes.text();

    if (y !== undefined) {
      const yearStr = y.toString();
      const $ = cheerio.load(tournamentsHTML);
      const saisonOption = $('select[name="filter_saison_id"] option')
        .filter((i, el) => $(el).text().trim().includes(yearStr))
        .first();

      if (saisonOption.length > 0) {
        const saisonId = saisonOption.val();
        console.log(`Filtering for year ${yearStr} (saison_id: ${saisonId})...`);

        const formData = new URLSearchParams();
        formData.append('filter_saison_id', saisonId as string);
        formData.append('task', 'turniere');

        tournamentsRes = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        tournamentsHTML = await tournamentsRes.text();
      } else {
        console.warn(`Year ${yearStr} not found in saison list, falling back to current.`);
      }
    }

    const yearIds = parseIntermediaryTournamentsIds(tournamentsHTML);
    tournamentIdsList = [...tournamentIdsList, ...yearIds];
  }

  // Remove potential duplicates and preserve order
  tournamentIdsList = Array.from(new Set(tournamentIdsList));

  if (tournamentIds && tournamentIds.length > 0) {
    tournamentIdsList = tournamentIdsList.filter((id) => tournamentIds.includes(id));
  }

  if (limit) {
    tournamentIdsList = tournamentIdsList.slice(0, limit);
  }

  const limitConcurrencyOuter = pLimit(4); const limitConcurrencyInner = pLimit(4);
  const tasks = tournamentIdsList.map((tournamentId, i) => {
    return limitConcurrencyOuter(async () => {
      if (withoutDetails) {
        return [{ id: tournamentId, tournamentGroupID: tournamentId, name: '', type: '', date: '', place: '', mainRound: { finalPlacements: [], divisions: [] } }];
      }
      console.log(`[${i + 1}/${tournamentIdsList.length}] Processing tournament series ID: ${tournamentId}...`);
      try {
        const actualTournamentIds = await parseActualTournamentId(tournamentId);
        const subTasks = actualTournamentIds.map(actualTournamentId => {
          return limitConcurrencyInner(async () => {
             try {
               return await getTournamentDetails(actualTournamentId, tournamentId);
             } catch (error) {
               console.error(`  Error processing tournament ID ${actualTournamentId}:`, error instanceof Error ? error.message : error);
               throw new Error(`  Error processing tournament ID ${actualTournamentId}: ${error instanceof Error ? error.message : error}`);
             }
          });
        });
        const subResults = await Promise.all(subTasks);
        return subResults;
      } catch (error) {
        console.error(`  Error processing tournament series ID ${tournamentId}:`, error instanceof Error ? error.message : error);
        throw new Error(`  Error processing tournament series ID ${tournamentId}: ${error instanceof Error ? error.message : error}`);
      }
    });
  });

  const results = await Promise.all(tasks);

  // Flatten results and add to tournaments
  for (const group of results) {
    if (group) {
      tournaments.push(...group);
    }
  }

  // Sort by date descending (DD.MM.YYYY)
  tournaments.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    const parseDate = (dString: string) => {
      const parts = dString.split('.');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
      }
      return 0;
    };
    return parseDate(b.date) - parseDate(a.date);
  });

  return tournaments;
}

export async function getTournamentDetails(actualTournamentId: number, tournamentGroupID?: number): Promise<Tournament> {
  console.log(`  Fetching details for tournament ID: ${actualTournamentId}...`);
  const detailsUrl = `https://nwtfv.com/turniere?task=turnierdisziplin&id=${actualTournamentId}&format=json`;
  const detailsRes = await fetch(detailsUrl);
  const detailsHtml = await detailsRes.text();
  const tournamentDetails = parseTournamentDetails(detailsHtml);
  const tournament: Tournament = { id: actualTournamentId, tournamentGroupID: tournamentGroupID ?? actualTournamentId, ...tournamentDetails };
  console.log(`  Successfully parsed tournament: ${tournament.name} ${tournament.type} at ${tournament.place}, ${tournament.numberOfParticipants} participants`);
  return tournament;
}

/**
 * Parses the main tournaments list HTML
 * @param {string} html
 * @returns {number[]} List of intermediary tournament ids
 */
function parseIntermediaryTournamentsIds(html: string, limit?: number): number[] {
  const $ = cheerio.load(html);
  const results: number[] = [];
  const rows = $('tr.sectiontableentry1, tr.sectiontableentry2').toArray();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const aTags = $(row).find('a');
    if (aTags.length < 2) continue;

    const dateAnchor = $(aTags[1]);

    const href = dateAnchor.attr('href');
    if (!href) throw new Error('Missing href on date anchor');
    const idMatch = href.match(/turnierid=(\d+)/);
    if (!idMatch) throw new Error(`Could not find turnierid in href: ${href}`);
    const id = parseInt(idMatch[1], 10);

    results.push(id);
    if (limit && results.length >= limit) {
      break;
    }
  }
  return results;
}

/**
 * Parses the tournament details HTML to find all sub-tournament IDs
 * @param {number} tournamentId 
 * @returns {Promise<number[]>}
 */
async function parseActualTournamentId(tournamentId: number): Promise<number[]> {
  const intermediaryUrl = `https://nwtfv.com/turniere?task=turnierdisziplinen&turnierid=${tournamentId}&format=json`;
  const intermediaryRes = await fetch(intermediaryUrl);
  const intermediaryHtml = await intermediaryRes.text();
  const $details = cheerio.load(intermediaryHtml);

  const ids: number[] = [];
  $details('a').each((_, el) => {
    const elHref = $details(el).attr('href') || '';
    const match = elHref.match(/turnierdisziplin&id=(\d+)/);
    if (match) {
      ids.push(parseInt(match[1], 10));
    }
  });

  if (ids.length > 0) {
    return Array.from(new Set(ids)); // Remove duplicates if any
  }
  throw new Error(`Could not parse actual tournament ids for tournamentId ${tournamentId}`);
}

export function parseTournamentDetails(html: string): Omit<Tournament, 'id' | 'tournamentGroupID'> {
  const $ = cheerio.load(html);

  // Extract Metadata
  const tournamentTitle = $('h2').first().text().trim();
  const tournamentTitleParts = tournamentTitle.split(':');
  const name = tournamentTitleParts.length > 1 ? tournamentTitleParts.slice(0, -1).join(':').trim() : tournamentTitle;

  let place = '';
  let date = '';
  const tournamentInfo = $('td:contains("Meldungen")').first().text().trim();
  if (tournamentInfo) {
    const tournamentInfoParts = tournamentInfo.split(',');
    if (tournamentInfoParts.length > 0) {
      place = tournamentInfoParts[0].trim();
    } else {
      throw new Error('Could not parse place');
    }

    const dateMatch = tournamentInfo.match(/\d{2}\.\d{2}\.\d{4}/);
    if (dateMatch) {
      date = dateMatch[0];
    } else {
      throw new Error('Could not parse date');
    }
  } else {
    throw new Error('Could not find tournament info cell');
  }

  let type = '';
  const breadcrumbTh = $('th.sectiontableheader').filter((i, el) => $(el).text().includes('>')).first();
  if (breadcrumbTh.length > 0) {
    const bcParts = breadcrumbTh.text().split('>');
    type = bcParts[bcParts.length - 1].trim();
  } else if (tournamentTitleParts.length > 1) {
    type = tournamentTitleParts[tournamentTitleParts.length - 1].trim();
  } else {
    throw new Error('Could not parse tournament type');
  }

  let numberOfParticipants: number;
  const bodyText = $('body').text() || $.text();
  const meldMatch = bodyText.match(/(\d+)\s*Meldungen/);
  if (meldMatch) {
    numberOfParticipants = parseInt(meldMatch[1], 10);
  } else {
    // Attempt fallback just on tds
    const tdsText = $('td').text();
    const tdsMatch = tdsText.match(/(\d+)\s*Meldungen/);
    if (tdsMatch) {
      numberOfParticipants = parseInt(tdsMatch[1], 10);
    } else {
      throw new Error('Could not parse number of participants');
    }
  }

  // Specifically target the table that follows the "Endplatzierungen" header
  // or fallback to the first table containing a "Platz" header
  const headingTable = $('td.contentheading:contains("Endplatzierungen")').closest('table');
  let targetTable = headingTable.length > 0 ? headingTable.next('table') : null;

  if (!targetTable || targetTable.length === 0) {
    targetTable = $('table').filter((i, el) => $(el).find('th:contains("Platz")').length > 0).first();
  }

  if (!targetTable || targetTable.length === 0) {
    throw new Error('Could not find main round table');
  }

  const mainRound = parseRound($, targetTable);

  // Parse qualifying round
  const vorrundeHeadingTable = $('td.contentheading:contains("Vorrunde")').closest('table');
  let vorrundeTable = vorrundeHeadingTable.length > 0 ? vorrundeHeadingTable.next('table') : null;

  let qualifyingRound: Round | undefined;
  if (vorrundeTable && vorrundeTable.length > 0) {
    qualifyingRound = parseRound($, vorrundeTable);
  }

  const tournamentDetails: Omit<Tournament, 'id' | 'tournamentGroupID'> = {
    name,
    date,
    place,
    type,
    numberOfParticipants,
    mainRound,
    qualifyingRound
  };

  return tournamentDetails;
}

function parseRound($: cheerio.CheerioAPI, targetTable: cheerio.Cheerio<any> | null): Round {
  const finalPlacements: Placement[] = [];
  const rows = targetTable ? targetTable.find('tr.sectiontableentry1, tr.sectiontableentry2').toArray() : $('tr.sectiontableentry1, tr.sectiontableentry2').toArray();

  for (const row of rows) {
    const tds = $(row).children('td');
    if (tds.length === 0) continue;

    const placeStr = $(tds[0]).text().trim();
    const rank = parseInt(placeStr, 10);

    if (isNaN(rank)) {
      continue;
    }

    const playersListTd = $(tds[1]).find('table tr td').first();
    if (!playersListTd.length) throw new Error('Could not find players list cell');
    const competitor = parseCompetitor($, playersListTd);

    finalPlacements.push({
      rank,
      competitor
    });
  }

  const divisions = findDivisions($, targetTable, finalPlacements);

  return {
    finalPlacements,
    divisions
  };
}

const DIVISION_SKILL_MAP: Record<string, SkillLevel> = {
  'Hauptrunde': 'Pro',
  'Zusatzrunde': 'Amateur',
  'Vorrunde': 'Open',
};

function findDivisions($: cheerio.CheerioAPI, targetTable: cheerio.Cheerio<any> | null, finalPlacements: Placement[]): Division[] {
  const divisions: Division[] = [];
  if (!targetTable) return divisions;

  let sibling = targetTable.next();
  while (sibling.length > 0) {
    const headingTd = sibling.find('td.contentheading');

    if (headingTd.length > 0) {
      // Found a contentheading — check if it maps to a division skill level
      const headingText = headingTd.text().trim();
      const skillLevel = DIVISION_SKILL_MAP[headingText] ?? 'Open';


      // Look for a game table (Gewinner/Verlierer) after this heading
      let foundGameTable = false;
      let next = sibling.next();
      while (next.length > 0) {
        if (next.is('table') && next.find('th:contains("Gewinner")').length > 0) {
          divisions.push({ skillLevel, gameStages: parseDivisionTable($, next, finalPlacements) });
          sibling = next; // advance past the game table
          foundGameTable = true;
          break;
        }
        // Stop if we hit a placements table (new round) or another heading
        if (next.is('table') && next.find('th:contains("Platz")').length > 0) break;
        if (next.find('td.contentheading').length > 0) break;
        next = next.next();
      }
      if (!foundGameTable) break; // Heading leads to a new round, stop
    } else if (sibling.is('table') && sibling.find('th:contains("Gewinner")').length > 0) {
      // Found a game table directly (e.g., after qualifying placements)
      // Look backward from targetTable for the nearest contentheading to get the division name
      let prev = targetTable.prev();
      while (prev.length > 0) {
        const ht = prev.find('td.contentheading');
        if (ht.length > 0) {
          const divName = ht.text().trim();
          const skillLevel = DIVISION_SKILL_MAP[divName] ?? 'Open';
          divisions.push({ skillLevel, gameStages: parseDivisionTable($, sibling, finalPlacements) });
          break;
        }
        prev = prev.prev();
      }
    }

    sibling = sibling.next();
  }

  return divisions;
}

function parseDivisionTable($: cheerio.CheerioAPI, gameTable: cheerio.Cheerio<any>, finalPlacements: Placement[]): GameStage[] {
  const gameStages: GameStage[] = [];
  let currentStageName: string | null = null;
  let currentGames: Game[] = [];

  const rows = gameTable.find('> tbody > tr, > tr').toArray();

  for (const row of rows) {
    const $row = $(row);

    // Check if this is a game stage header row
    // Game stage headers are in: <tr class="sectiontableheader" align="center"><th><font size=-2><i>StageName</i></font></th></tr>
    if ($row.hasClass('sectiontableheader') && $row.attr('align') === 'center') {
      const stageText = $row.find('font i').text().trim();
      if (stageText) {
        // Save previous stage if exists
        if (currentStageName !== null) {
          gameStages.push({ name: currentStageName, games: currentGames });
        }
        currentStageName = stageText;
        currentGames = [];
        continue;
      }
    }

    // Check if this is a game row (sectiontableentry1 or sectiontableentry2)
    if ($row.hasClass('sectiontableentry1') || $row.hasClass('sectiontableentry2')) {
      if (currentStageName === null) continue;

      const tds = $row.children('td');
      // Game rows should have at least 2 td cells (Gewinner and Verlierer)
      if (tds.length < 2) continue;

      // With scores: 3 columns (Gewinner, Ergebnis, Verlierer)
      // Without scores: 2 columns (Gewinner, Verlierer)
      const hasScores = tds.length >= 3;
      const winnerTd = $(tds[0]).find('table tr td').first();
      // If there are 3 columns, the loser is in the 3rd column (index 2)
      const loserTd = $(tds[hasScores ? 2 : 1]).find('table tr td').first();

      if (!winnerTd.length || !loserTd.length) continue;
      if (!winnerTd.text().trim() || !loserTd.text().trim()) continue;

      const competitor1 = parseCompetitor($, winnerTd, finalPlacements);
      const competitor2 = parseCompetitor($, loserTd, finalPlacements);

      let scores: Game['scores'];
      if (hasScores) {
        const scoreText = $(tds[1]).text().trim();
        scores = scoreText.split('|').map(s => {
          const [s1, s2] = s.trim().split(':').map(n => parseInt(n, 10));
          return { score1: s1, score2: s2 };
        });
      } else {
        scores = [{ score1: 1, score2: 0 }];
      }

      const game: Game = {
        competitor1,
        competitor2,
        scores
      };

      currentGames.push(game);
    }
  }

  // Don't forget last stage
  if (currentStageName !== null) {
    gameStages.push({ name: currentStageName, games: currentGames });
  }

  // The stages are parsed in reverse order (Finale first in HTML, but test expects 
  // chronological order: Achtelfinale, Viertelfinale, etc.)
  // Actually looking at the test: stages[0] = 'Achtelfinale', stages[4] = 'Finale'
  // But in HTML: Finale comes first. So we need to reverse.
  gameStages.reverse();

  return gameStages;
}

function parseCompetitor($: cheerio.CheerioAPI, playersListTd: cheerio.Cheerio<any>, finalPlacements?: Placement[]): Competitor {
  const htmlContent = playersListTd.html();
  if (!htmlContent) throw new Error('Players list cell is empty');
  const htmlParts = htmlContent.split(/<br\s*\/?>/i);

  const parsePlayerFromHtmlPart = (part: string): Player => {
    const part$ = cheerio.load(part);
    const aTag = part$('a');
    let name: string;
    let nwtfvId: number | undefined;

    if (aTag.length > 0) {
      name = aTag.text().trim();
      const href = aTag.attr('href');
      if (!href) throw new Error('Missing href on player link');
      const match = href.match(/spieler_details.*?id=(\d+)/);
      if (match) {
        nwtfvId = parseInt(match[1], 10);
      }
    } else {
      name = part$.text().trim();
    }

    if (!name) {
      console.error('Failed to parse name from part:', part);
      throw new Error('Could not parse player name');
    }

    // If no nwtfvId from link, try to find it from finalPlacements by name
    if (nwtfvId === undefined && finalPlacements) {
      for (const placement of finalPlacements) {
        if (placement.competitor.type === 'player' && placement.competitor.player.name === name) {
          nwtfvId = placement.competitor.player.nwtfvId;
          break;
        }
        if (placement.competitor.type === 'team') {
          if (placement.competitor.player1.name === name) {
            nwtfvId = placement.competitor.player1.nwtfvId;
            break;
          }
          if (placement.competitor.player2.name === name) {
            nwtfvId = placement.competitor.player2.nwtfvId;
            break;
          }
        }
      }
    }

    return { name, nwtfvId };
  };

  const parsedPlayers = htmlParts
    .filter(part => part.trim().length > 0)
    .map(part => parsePlayerFromHtmlPart(part))
    .filter(p => p.name.length > 0);

  if (parsedPlayers.length === 0) {
    console.error('Original htmlContent was:', htmlContent);
    throw new Error('Could not parse competitor');
  }

  if (parsedPlayers.length >= 2) {
    return {
      type: 'team',
      player1: parsedPlayers[0],
      player2: parsedPlayers[1]
    };
  }

  return {
    type: 'player',
    player: parsedPlayers[0]
  };
}