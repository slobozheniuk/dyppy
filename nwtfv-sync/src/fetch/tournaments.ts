import pLimit from 'p-limit';
import * as cheerio from 'cheerio';
import { fetchTournamentHTML, fetchTournamentGroupHTML, fetchAvailableYears as fetchYearsMap } from '../fetch';

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
  date: Date;
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

const TOURNAMENTS_URL = 'https://nwtfv.com/turniere?format=json';

// ─── Public fetch functions ───────────────────────────────────────────────────

export async function fetchAvailableYears(): Promise<string[]> {
  const yearsMap = await fetchYearsMap();
  const years = Object.keys(yearsMap);
  years.sort((a, b) => parseInt(a) - parseInt(b));
  return years;
}

export async function fetchIntermediaryIds(year: string): Promise<number[]> {
  const yearsMap = await fetchYearsMap();
  const saisonId = yearsMap[year];

  if (!saisonId) {
    console.warn(`  ⚠ Year ${year} not found in saison list.`);
    return [];
  }

  const formData = new URLSearchParams();
  formData.append('filter_saison_id', saisonId);
  formData.append('task', 'turniere');

  const filteredRes = await fetch(TOURNAMENTS_URL, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const filteredHtml = await filteredRes.text();

  const $f = cheerio.load(filteredHtml);
  const ids: number[] = [];
  $f('tr.sectiontableentry1, tr.sectiontableentry2').each((_, row) => {
    const aTags = $f(row).find('a');
    if (aTags.length < 2) return;
    const href = $f(aTags[1]).attr('href') ?? '';
    const match = href.match(/turnierid=(\d+)/);
    if (match) ids.push(parseInt(match[1], 10));
  });

  return Array.from(new Set(ids));
}

export async function fetchActualIds(intermediaryId: number): Promise<number[]> {
  const html = await fetchTournamentGroupHTML(intermediaryId);

  const $ = cheerio.load(html);
  const ids: number[] = [];
  $('a').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const match = href.match(/turnierdisziplin&id=(\d+)/);
    if (match) ids.push(parseInt(match[1], 10));
  });

  const unique = Array.from(new Set(ids));
  if (unique.length === 0) {
    throw new Error(`Could not parse actual tournament ids for intermediaryId ${intermediaryId}`);
  }
  return unique;
}

// ─── getTournaments (high-level) ──────────────────────────────────────────────

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

  tournamentIdsList = Array.from(new Set(tournamentIdsList));

  if (tournamentIds && tournamentIds.length > 0) {
    tournamentIdsList = tournamentIdsList.filter((id) => tournamentIds.includes(id));
  }

  if (limit) {
    tournamentIdsList = tournamentIdsList.slice(0, limit);
  }

  const limitConcurrencyOuter = pLimit(4);
  const limitConcurrencyInner = pLimit(4);
  const tasks = tournamentIdsList.map((tournamentId, i) => {
    return limitConcurrencyOuter(async () => {
      if (withoutDetails) {
        return [{ id: tournamentId, tournamentGroupID: tournamentId, name: '', type: '', date: new Date(0), place: '', mainRound: { finalPlacements: [], divisions: [] } }];
      }
      console.log(`[${i + 1}/${tournamentIdsList.length}] Processing tournament series ID: ${tournamentId}...`);
      try {
        const actualTournamentIds = await fetchActualIds(tournamentId);
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

  for (const group of results) {
    if (group) {
      tournaments.push(...group);
    }
  }

  tournaments.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return b.date.getTime() - a.date.getTime();
  });

  return tournaments;
}

export async function getTournamentDetails(actualTournamentId: number, tournamentGroupID?: number): Promise<Tournament> {
  console.log(`  Fetching details for tournament ID: ${actualTournamentId}...`);
  const html = await fetchTournamentHTML(actualTournamentId);
  const tournamentDetails = parseTournamentDetails(html);
  const tournament: Tournament = { id: actualTournamentId, tournamentGroupID: tournamentGroupID ?? actualTournamentId, ...tournamentDetails };
  console.log(`  Successfully parsed tournament: ${tournament.name} ${tournament.type} at ${tournament.place}, ${tournament.numberOfParticipants} participants`);
  return tournament;
}

// ─── Parsing functions ────────────────────────────────────────────────────────

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

export function parseTournamentDetails(html: string): Omit<Tournament, 'id' | 'tournamentGroupID'> {
  const $ = cheerio.load(html);

  const tournamentTitle = $('h2').first().text().trim();
  const tournamentTitleParts = tournamentTitle.split(':');
  const name = tournamentTitleParts.length > 1 ? tournamentTitleParts.slice(0, -1).join(':').trim() : tournamentTitle;

  let place = '';
  let date: Date | null = null;
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
      const [dd, mm, yyyy] = dateMatch[0].split('.');
      date = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
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
    const tdsText = $('td').text();
    const tdsMatch = tdsText.match(/(\d+)\s*Meldungen/);
    if (tdsMatch) {
      numberOfParticipants = parseInt(tdsMatch[1], 10);
    } else {
      throw new Error('Could not parse number of participants');
    }
  }

  const headingTable = $('td.contentheading:contains("Endplatzierungen")').closest('table');
  let targetTable = headingTable.length > 0 ? headingTable.next('table') : null;

  if (!targetTable || targetTable.length === 0) {
    targetTable = $('table').filter((i, el) => $(el).find('th:contains("Platz")').length > 0).first();
  }

  if (!targetTable || targetTable.length === 0) {
    throw new Error('Could not find main round table');
  }

  const mainRound = parseRound($, targetTable);

  const vorrundeHeadingTable = $('td.contentheading:contains("Vorrunde")').closest('table');
  let vorrundeTable = vorrundeHeadingTable.length > 0 ? vorrundeHeadingTable.next('table') : null;

  let qualifyingRound: Round | undefined;
  if (vorrundeTable && vorrundeTable.length > 0) {
    qualifyingRound = parseRound($, vorrundeTable);
  }

  return {
    name,
    date: date!,
    place,
    type,
    numberOfParticipants,
    mainRound,
    qualifyingRound,
  };
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

    finalPlacements.push({ rank, competitor });
  }

  const divisions = findDivisions($, targetTable, finalPlacements);

  return { finalPlacements, divisions };
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
      const headingText = headingTd.text().trim();
      const skillLevel = DIVISION_SKILL_MAP[headingText] ?? 'Open';

      let foundGameTable = false;
      let next = sibling.next();
      while (next.length > 0) {
        if (next.is('table') && next.find('th:contains("Gewinner")').length > 0) {
          divisions.push({ skillLevel, gameStages: parseDivisionTable($, next, finalPlacements) });
          sibling = next;
          foundGameTable = true;
          break;
        }
        if (next.is('table') && next.find('th:contains("Platz")').length > 0) break;
        if (next.find('td.contentheading').length > 0) break;
        next = next.next();
      }
      if (!foundGameTable) break;
    } else if (sibling.is('table') && sibling.find('th:contains("Gewinner")').length > 0) {
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

    if ($row.hasClass('sectiontableheader') && $row.attr('align') === 'center') {
      const stageText = $row.find('font i').text().trim();
      if (stageText) {
        if (currentStageName !== null) {
          gameStages.push({ name: currentStageName, games: currentGames });
        }
        currentStageName = stageText;
        currentGames = [];
        continue;
      }
    }

    if ($row.hasClass('sectiontableentry1') || $row.hasClass('sectiontableentry2')) {
      if (currentStageName === null) continue;

      const tds = $row.children('td');
      if (tds.length < 2) continue;

      const hasScores = tds.length >= 3;
      const winnerTd = $(tds[0]).find('table tr td').first();
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

      currentGames.push({ competitor1, competitor2, scores });
    }
  }

  if (currentStageName !== null) {
    gameStages.push({ name: currentStageName, games: currentGames });
  }

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
    return { type: 'team', player1: parsedPlayers[0], player2: parsedPlayers[1] };
  }

  return { type: 'player', player: parsedPlayers[0] };
}
