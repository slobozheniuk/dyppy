import { fetchPlayerJSON } from "../fetch";

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
