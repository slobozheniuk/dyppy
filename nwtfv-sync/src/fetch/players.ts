import { fetchPlayerJSON } from "../fetch";

// ─── Match history types ──────────────────────────────────────────────────────

export type MatchResult = 'win' | 'loss' | 'draw';

/**
 * Represents a single game from the player details API.
 * Works for both einzel (singles) and doppel (doubles).
 */
export type PlayerGame = {
  date: Date;
  tournamentName: string;
  /** e.g. "3. Runde" — the individual round within the stage */
  roundName: string;
  /** e.g. "2. Zusatzrunde" — the broader stage/division name */
  roundStageName: string;
  /** Outcome from the perspective of spieler_1/spieler_2 */
  result: MatchResult;
  /** nwtfvIds of the player(s) on the left side (spieler_1, spieler_2) */
  playerIds: number[];
  /** nwtfvIds of the opponent(s) (gegner_1, gegner_2) */
  opponentIds: number[];
};

export type PlayerGames = {
  einzel: PlayerGame[];
  doppel: PlayerGame[];
};

// ─── Parse match history ──────────────────────────────────────────────────────

function ergebnisToResult(ergebnis: number): MatchResult {
  if (ergebnis === 0) return 'draw';
  if (ergebnis === 1) return 'win';
  return 'loss';
}

function parseRawGame(g: any, isDouble: boolean): PlayerGame {
  const playerIds: number[] = [parseInt(g.spieler_1.spieler_id, 10)];
  if (isDouble && g.spieler_2) playerIds.push(parseInt(g.spieler_2.spieler_id, 10));

  const opponentIds: number[] = [parseInt(g.gegner_1.spieler_id, 10)];
  if (isDouble && g.gegner_2) opponentIds.push(parseInt(g.gegner_2.spieler_id, 10));

  return {
    date: new Date(g.datum),
    tournamentName: g.veranstaltung,
    roundName: g.runde,
    roundStageName: g.runde_stufe,
    result: ergebnisToResult(g.ergebnis),
    playerIds,
    opponentIds,
  };
}

/**
 * Extracts the game history from a raw player details JSON response.
 * Only the last ~10 games per format are returned by the API.
 */
export function parsePlayerGames(json: any): PlayerGames {
  if (!json.data) throw new Error('Invalid player JSON: missing data');
  const einzel: PlayerGame[] = (json.data.einzel ?? []).map((g: any) => parseRawGame(g, false));
  const doppel: PlayerGame[] = (json.data.doppel ?? []).map((g: any) => parseRawGame(g, true));
  return { einzel, doppel };
}

export type Player = {
    id: number;
    name: string;
    surname: string;
    avatarUrl?: string;
    category: string;
    clubs: string[];
    organisations: string[];
    nationalNumber: string;
    internationalNumber?: string;
    rankings: Ranking[];
}

export type Ranking = {
    name: string;
    year: number;
    rank: number;
    totalRankedPlayers: number;
}

export function parsePlayerJson(json: any): Player {
    if (!json.data || !json.data.spieler) {
        throw new Error('Invalid JSON structure: missing data.spieler');
    }
    const s = json.data.spieler;
    return {
        id: parseInt(s.spieler_id, 10),
        name: s.vorname,
        surname: s.nachname,
        avatarUrl: s.bild || undefined,
        category: s.kategorie,
        clubs: (json.data.vereine || []).map((v: any) => v.vereinsname),
        organisations: (json.data.veranstalter || []).map((o: any) => o.veranstalterbezeichnung),
        nationalNumber: s.spielernr,
        internationalNumber: s.lizenznr || undefined,
        rankings: (json.data.ranglisten_platzierungen || []).map((r: any) => ({
            name: r.bezeichnung,
            year: parseInt(r.saisonbezeichnung, 10),
            rank: parseInt(r.platz, 10),
            totalRankedPlayers: parseInt(r.teilnehmer, 10)
        }))
    };
}

export async function getPlayerDetails(playerId: number): Promise<Player> {
    const json = await fetchPlayerJSON(playerId);
    return parsePlayerJson(json);
}

export const CATEGORY_MAPPING: Record<string, string> = {
    'J': 'Junior',
    'H': 'Men',
    'D': 'Women',
    'S': 'Senior'
};

export function getCategoryName(categoryCode: string): string {
    return CATEGORY_MAPPING[categoryCode] || categoryCode || 'Player';
}
