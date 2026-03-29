export interface ApiResponse {
  data: ApiData;
}

export interface ApiData {
  spieler: Spieler;
  vereine: Verein[];
  teams: Team[];
  veranstalter: Veranstalter[];
  ranglisten_platzierungen: RanglistenPlatzierung[];
  turnier_platzierungen: TurnierPlatzierung[];
  statistik: Statistik;
  elo: number;
  einstufung: string | null;
  einstufung_einzel: string | null;
  einstufung_doppel: string | null;
  einzel: Match[];
  doppel: Match[];
}

export interface Spieler {
  spieler_id: string;
  vorname: string;
  nachname: string;
  geschlecht: string;
  spielernr: string;
  lizenznr: string;
  pseudonym: string;
  bild_ausblenden: string;
  elo_einzel: string | null;
  elo_einzel_spiele: string | null;
  elo_doppel: string | null;
  elo_doppel_spiele: string | null;
  erstmals_gespielt: string;
  zuletzt_gespielt: string;
  einstufung_allgemein_id: string | null;
  einstufung_einzel_id: string | null;
  einstufung_doppel_id: string | null;
  kategorie: string;
}

export interface Verein {
  vereinsname: string;
}

export interface Team {
  teamname: string;
  bezeichnung: string;
  saisonbezeichnung: string;
  wettbewerbe: string;
}

export interface Veranstalter {
  veranstalterbezeichnung: string;
}

export interface RanglistenPlatzierung {
  bezeichnung: string;
  saisonbezeichnung: string;
  platz: string;
  punkte: string;
  teilnehmer: string;
}

export interface TurnierPlatzierung {
  turniermeldung_spieler_id: string;
  turniermeldung_id: string;
  spieler_id: string;
  turnierdisziplin_id: string;
  meldungsgruppe_id: string;
  rundenstufe: string;
  platz: string;
  turnier_id: string;
  disziplin: string;
  kuerzel: string;
  beginn: string;
  typ: string;
  elo_wertung: string;
  voranmeldung: string | null;
  voranmeldungen_rangliste_id: string | null;
  voranmeldungen_reihenfolge: string;
  reihenfolge: string;
  status: string;
  saison_id: string;
  veranstalter_id: string;
  turnierbezeichnung: string;
  turnierort: string;
  erster_tag: string;
  letzter_tag: string;
  kategorie: string;
  saisonbezeichnung: string;
  teilnehmer: string;
}

export interface Statistik {
  verein: string;
  spielernr_national: string;
  spielernr_international: string;
  elo_einzel: boolean;
  elo_doppel: boolean;
}

export interface MatchPlayer {
  spieler_id: string;
  bild: string;
  vorname: string;
  nachname: string;
}

export interface Match {
  datum: string;
  spieler_1: MatchPlayer;
  spieler_2?: MatchPlayer; // Optional since it's only in 'doppel'
  spieler_team: string | null;
  gegner_1: MatchPlayer;
  gegner_2?: MatchPlayer; // Optional since it's only in 'doppel'
  gegner_team: string | null;
  veranstaltung: string;
  runde: string;
  runde_stufe: string;
  ergebnis: number;
}
