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

export async function getTournaments({ limit }: { limit?: number } = {}): Promise<Tournament[]> {
  const tournaments: Tournament[] = [];
  const url = `https://nwtfv.com/turniere?format=json`;
  const res = await fetch(url);
  const tournamentsHTML = await res.text();
  const tournamentList = parseIntermediaryTournamentsIds(tournamentsHTML);
  console.log(`Found ${tournamentList.length} tournament IDs to process.`);

  for (let i = 0; i < tournamentList.length; i++) {
    const tournamentId = tournamentList[i];
    console.log(`[${i + 1}/${tournamentList.length}] Processing tournament ID: ${tournamentId}...`);
    try {
      const intermediaryUrl = `https://nwtfv.com/turniere?task=turnierdisziplinen&turnierid=${tournamentId}&format=json`;
      const intermediaryRes = await fetch(intermediaryUrl);
      const intermediaryHtml = await intermediaryRes.text();
      const actualTournamentId = parseActualTournamentId(intermediaryHtml);

      const tournament: Tournament = await getTournamentDetails(actualTournamentId);
      tournaments.push(tournament);
      if (limit && tournaments.length >= limit) {
        break;
      }
    } catch (error) {
      console.error(`  Error processing tournament ID ${tournamentId}:`, error instanceof Error ? error.message : error);
      // Continue to next tournament
    }
  }
  return tournaments;
}

export async function getTournamentDetails(actualTournamentId: number): Promise<Tournament> {
  console.log(`  Fetching details for tournament ID: ${actualTournamentId}...`);
  const detailsUrl = `https://nwtfv.com/turniere?task=turnierdisziplin&id=${actualTournamentId}&format=json`;
  const detailsRes = await fetch(detailsUrl);
  const detailsHtml = await detailsRes.text();
  const tournamentDetails = parseTournamentDetails(detailsHtml);
  const tournament: Tournament = { id: actualTournamentId, ...tournamentDetails };
  console.log(`  Successfully parsed tournament: ${tournament.name}`);
  return tournament;
}

/**
 * Parses the main tournaments list HTML
 * @param {string} html
 * @returns {number[]} List of intermediary tournament ids
 */
function parseIntermediaryTournamentsIds(html: string): number[] {
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
  }
  return results;
}

/**
 * Parses the tournament details HTML to find the details ID
 * @param {string} html 
 * @returns {number|null}
 */
function parseActualTournamentId(html: string): number {
  const $details = cheerio.load(html);
  const mehrLink = $details('a').filter((idx, el) => {
    const elHref = $details(el).attr('href') || '';
    return elHref.includes('task=turnierdisziplin&id=');
  }).first();

  if (mehrLink.length > 0) {
    const mehrHref = mehrLink.attr('href') || '';
    const detailsIdMatch = mehrHref.match(/turnierdisziplin&id=(\d+)/);
    if (detailsIdMatch) {
      return parseInt(detailsIdMatch[1], 10);
    }
  }
  throw new Error('Could not parse actual tournament id');
}

function parseTournamentDetails(html: string): Omit<Tournament, 'id'> {
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

  const tournamentDetails: Omit<Tournament, 'id'> = {
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
      const skillLevel = DIVISION_SKILL_MAP[headingText];
      if (!skillLevel) break; // Unknown heading, outside this round's scope

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
          const skillLevel = DIVISION_SKILL_MAP[divName];
          if (skillLevel) {
            divisions.push({ skillLevel, gameStages: parseDivisionTable($, sibling, finalPlacements) });
          }
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

    if (!name) throw new Error('Could not parse player name');

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
    .map(part => parsePlayerFromHtmlPart(part))
    .filter(p => p.name.length > 0);

  if (parsedPlayers.length === 0) {
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