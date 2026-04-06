import * as cheerio from 'cheerio';

const TOURNAMENT_GROUPS_URL = () => 'https://nwtfv.com/turniere?format=json';
const TOURNAMENT_GROUP_URL = (tournamentGroupId: number) => `https://nwtfv.com/turniere?task=turnierdisziplinen&turnierid=${tournamentGroupId}&format=json`;
const TOURNAMENT_URL = (tournamentId: number) => `https://nwtfv.com/turniere?task=turnierdisziplin&id=${tournamentId}&format=json`;
const PLAYER_URL = (playerId: number) => `https://nwtfv.com/spieler?task=spieler_details&id=${playerId}&format=json`;

/**
 * Fetches the JSON data for a specific player.
 * @param playerId The ID of the player.
 * @returns The JSON data for the player.
 */
export async function fetchPlayerJSON(playerId: number): Promise<any> {
    const url = PLAYER_URL(playerId);
    const json = await fetchJSON(url);
    return json;
}

/**
 * Fetches the HTML for a specific tournament.
 * @param tournamentId The ID of the tournament.
 * @returns The HTML for the tournament.
 */
export async function fetchTournamentHTML(tournamentId: number): Promise<string> {
    const url = TOURNAMENT_URL(tournamentId);
    const html = await fetchHTML(url);
    return html;
}

/**
 * Fetches the HTML for a specific tournament group.
 * @param tournamentGroupId The ID of the tournament group.
 * @returns The HTML for the tournament group.
 */
export async function fetchTournamentGroupHTML(tournamentGroupId: number): Promise<string> {
    const url = TOURNAMENT_GROUP_URL(tournamentGroupId);
    const html = await fetchHTML(url);
    return html;
}

/**
 * Fetches all tournaments for a given year.
 * @param year The year to fetch tournaments for.
 * @returns The HTML for the tournaments.
 */
export async function fetchTournamentGroupsHTML(year: number): Promise<string> {
    const years = await fetchAvailableYears();
    const saisonId = years[year];
    if (!saisonId) {
        throw new Error(`Year ${year} is not available, available years: ${Object.keys(years).join(', ')}`);
    }
    const url = TOURNAMENT_GROUPS_URL();
    const formData = new URLSearchParams();
    formData.append('filter_saison_id', saisonId as string);
    formData.append('task', 'turniere');

    const tournamentsRes = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    const tournamentsHTML = await tournamentsRes.text();
    return tournamentsHTML;
}

export async function fetchAvailableYears(): Promise<Record<string, string>> {
    const html = await fetchHTML(TOURNAMENT_GROUPS_URL());
    const $ = cheerio.load(html);

    const years: Record<string, string> = {};
    $('select[name="filter_saison_id"] option').each((_, el) => {
        const text = $(el).text().trim();
        if (/^[\d/]+$/.test(text)) {
            years[text] = $(el).attr('value') || '';
        }
    });

    return years;
}

async function fetchHTML(url: string): Promise<string> {
    const res = await fetch(url);
    const html = await res.text();
    return html;
}

async function fetchJSON(url: string): Promise<any> {
    const res = await fetch(url);
    const json = await res.json();
    return json;
}