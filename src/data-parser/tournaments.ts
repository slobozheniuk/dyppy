import * as cheerio from 'cheerio';

export type SkillLevel = 'Pro' | 'Amateur' | 'Open';
export type Player = {
  name: string;
  id?: number;
}

export type Competitor =
  | { type: 'player'; player: Player }
  | { type: 'team'; player1: Player; player2: Player }

export type Game = {
  competitor1: Competitor;
  competitor2: Competitor;
  score1: number;
  score2: number;
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

  for (const tournamentId of tournamentList) {
    const intermediaryUrl = `https://nwtfv.com/turniere?task=turnierdisziplinen&turnierid=${tournamentId}&format=json`;
    const intermediaryRes = await fetch(intermediaryUrl);
    const intermediaryHtml = await intermediaryRes.text();
    const actualTournamentId = parseActualTournamentId(intermediaryHtml);

    const tournament: Tournament = await getTournamentDetails(actualTournamentId);
    tournaments.push(tournament);
    if (limit && tournaments.length >= limit) {
      break;
    }
  }
  return tournaments;
}

export async function getTournamentDetails(actualTournamentId: number): Promise<Tournament> {
  const detailsUrl = `https://nwtfv.com/turniere?task=turnierdisziplin&id=${actualTournamentId}&format=json`;
  const detailsRes = await fetch(detailsUrl);
  const detailsHtml = await detailsRes.text();
  const tournamentDetails = parseTournamentDetails(detailsHtml);
  const tournament: Tournament = { id: actualTournamentId, ...tournamentDetails };
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

    const href = dateAnchor.attr('href') || '';
    const idMatch = href.match(/turnierid=(\d+)/);
    const id = idMatch ? parseInt(idMatch[1], 10) : 0;

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
    if (tournamentInfoParts.length > 0) place = tournamentInfoParts[0].trim();

    const dateMatch = tournamentInfo.match(/\d{2}\.\d{2}\.\d{4}/);
    if (dateMatch) date = dateMatch[0];
  }

  let type = '';
  const breadcrumbTh = $('th.sectiontableheader').filter((i, el) => $(el).text().includes('>')).first();
  if (breadcrumbTh.length > 0) {
    const bcParts = breadcrumbTh.text().split('>');
    type = bcParts[bcParts.length - 1].trim();
  } else if (tournamentTitleParts.length > 1) {
    type = tournamentTitleParts[tournamentTitleParts.length - 1].trim();
  }

  let numberOfParticipants = null;
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
    }
  }

  // Specifically target the table that follows the "Endplatzierungen" header
  // or fallback to the first table containing a "Platz" header
  const headingTable = $('td.contentheading:contains("Endplatzierungen")').closest('table');
  let targetTable = headingTable.length > 0 ? headingTable.next('table') : null;

  if (!targetTable || targetTable.length === 0) {
    targetTable = $('table').filter((i, el) => $(el).find('th:contains("Platz")').length > 0).first();
  }

  const mainRound = parseRound($, targetTable);

  const vorrundeHeadingTable = $('td.contentheading:contains("Vorrunde")').closest('table');
  let vorrundeTable = vorrundeHeadingTable.length > 0 ? vorrundeHeadingTable.next('table') : null;
  const qualifyingRound = vorrundeTable && vorrundeTable.length > 0 ? parseRound($, vorrundeTable) : undefined;

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

    // Ignore rows like Hauptrunde where the first TD isn't a placement number
    if (isNaN(rank)) {
      continue;
    }

    // Players are in a nested table inside tds[1] (usually first TD of that nested table)
    const playersListTd = $(tds[1]).find('table tr td').first();
    if (!playersListTd.length) continue;
    const competitor = parseCompetitor($, playersListTd);

    finalPlacements.push({
      rank,
      competitor
    });
  }

  return {
    finalPlacements,
    divisions: []
  };
}

function parseCompetitor($: cheerio.CheerioAPI, playersListTd: cheerio.Cheerio<any>): Competitor {
  const htmlContent = playersListTd.html() || '';
  const htmlParts = htmlContent.split(/<br\s*\/?>/i);

  const parsePlayerFromHtmlPart = (part: string): { name: string; id?: number } => {
    const part$ = cheerio.load(part);
    const aTag = part$('a');
    let name = '';
    let id: number | undefined;

    if (aTag.length > 0) {
      name = aTag.text().trim();
      const href = aTag.attr('href') || '';
      const match = href.match(/spieler_details.*?id=(\d+)/);
      if (match) {
        id = parseInt(match[1], 10);
      }
    } else {
      name = part$.text().trim();
    }

    return { name, id };
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