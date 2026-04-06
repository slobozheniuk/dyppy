import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAvailableYears, fetchTournamentGroupsHTML } from '../src/fetch.js';
import { parsePlayerGames } from '../src/fetch/players.js';

const MOCK_YEARS_HTML = `
  <html>
    <body>
      <select name="filter_saison_id" size="1" onchange="document.adminForm.submit();">
        <option value="21" selected="">2026</option>
        <option value="20">2025</option>
        <option value="18">2024</option>
        <option value="17">2023</option>
        <option value="16">2022</option>
        <option value="15">2021</option>
        <option value="14">2020/21</option>
        <option value="13">2019</option>
        <option value="11">2018</option>
        <option value="10">2017</option>
        <option value="9">2016</option>
        <option value="8">2015</option>
        <option value="7">2014</option>
        <option value="6">2013</option>
        <option value="5">2012</option>
        <option value="4">2011</option>
        <option value="1">2010</option>
        <option value="3">2009</option>
      </select>
    </body>
  </html>
`;

describe('fetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('fetchAvailableYears', () => {
    it('should fetch and parse available years from the select options', async () => {
      vi.mocked(fetch).mockResolvedValue({
        text: async () => MOCK_YEARS_HTML,
      } as Response);

      const years = await fetchAvailableYears();

      expect(years).toEqual({
        '2009': '3',
        '2010': '1',
        '2011': '4',
        '2012': '5',
        '2013': '6',
        '2014': '7',
        '2015': '8',
        '2016': '9',
        '2017': '10',
        '2018': '11',
        '2019': '13',
        '2020/21': '14',
        '2021': '15',
        '2022': '16',
        '2023': '17',
        '2024': '18',
        '2025': '20',
        '2026': '21',
      });
      expect(fetch).toHaveBeenCalledWith('https://nwtfv.com/turniere?format=json');
    });
  });

  describe('fetchTournamentGroupsHTML', () => {
    it('should perform a POST request with the correct saisonId to fetch tournament groups HTML', async () => {
      const mockTournamentHtml = '<table>Tournaments 2024</table>';

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          text: async () => MOCK_YEARS_HTML,
        } as Response)
        .mockResolvedValueOnce({
          text: async () => mockTournamentHtml,
        } as Response);

      const html = await fetchTournamentGroupsHTML(2024);

      expect(html).toBe(mockTournamentHtml);
      expect(fetch).toHaveBeenCalledWith('https://nwtfv.com/turniere?format=json', expect.objectContaining({
        method: 'POST',
        body: expect.any(URLSearchParams),
      }));

      const lastCallArgs = vi.mocked(fetch).mock.calls[1];
      const body = lastCallArgs[1]?.body as URLSearchParams;
      expect(body.get('filter_saison_id')).toBe('18');
      expect(body.get('task')).toBe('turniere');
    });

    it('should throw an error if the year is not available', async () => {
      vi.mocked(fetch).mockResolvedValue({
        text: async () => MOCK_YEARS_HTML,
      } as Response);

      await expect(fetchTournamentGroupsHTML(2027)).rejects.toThrow('Year 2027 is not available');
    });

    it('integration: should fetch real HTML from nwtfv.com without mocks', async () => {
      vi.unstubAllGlobals();

      const html = await fetchTournamentGroupsHTML(2025);

      expect(html).toContain('<option value="20" selected>2025</option>');
      expect(html.length).toBeGreaterThan(1000);
    });
  });

  describe('parsePlayerGames', () => {
    const MOCK_PLAYER_JSON = {
      data: {
        spieler: { spieler_id: '10034' },
        einzel: [
          {
            datum: '2026-03-28 00:00:00',
            spieler_1: { spieler_id: '10034', vorname: 'Evgenii', nachname: 'Slobozheniuk' },
            spieler_team: null,
            gegner_1: { spieler_id: '10037', vorname: 'Bennet Henry', nachname: 'Oberrecht' },
            gegner_team: null,
            veranstaltung: 'Mini - Challenger',
            runde: '3. Runde',
            runde_stufe: '2. Zusatzrunde',
            ergebnis: 0,
          },
          {
            datum: '2026-03-28 00:00:00',
            spieler_1: { spieler_id: '10034', vorname: 'Evgenii', nachname: 'Slobozheniuk' },
            spieler_team: null,
            gegner_1: { spieler_id: '8595', vorname: 'Andre', nachname: 'Danowski' },
            gegner_team: null,
            veranstaltung: 'Mini - Challenger',
            runde: '4. Runde',
            runde_stufe: '2. Zusatzrunde',
            ergebnis: 1,
          },
          {
            datum: '2026-03-28 00:00:00',
            spieler_1: { spieler_id: '10120', vorname: 'Cristiano', nachname: 'Vieira Martins' },
            spieler_team: null,
            gegner_1: { spieler_id: '10034', vorname: 'Evgenii', nachname: 'Slobozheniuk' },
            gegner_team: null,
            veranstaltung: 'Mini - Challenger',
            runde: 'Platz 3',
            runde_stufe: 'Hauptrunde',
            ergebnis: 2,
          },
        ],
        doppel: [
          {
            datum: '2026-03-13 00:00:00',
            spieler_1: { spieler_id: '10034', vorname: 'Evgenii', nachname: 'Slobozheniuk' },
            spieler_2: { spieler_id: '9647', vorname: 'Mark', nachname: 'Gerling' },
            spieler_team: null,
            gegner_1: { spieler_id: '10120', vorname: 'Cristiano', nachname: 'Vieira Martins' },
            gegner_2: { spieler_id: '10121', vorname: 'Marie', nachname: 'Klein Reesink' },
            gegner_team: null,
            veranstaltung: 'Mini - Challenger',
            runde: '5. Runde',
            runde_stufe: 'Vorrunde',
            ergebnis: 0,
          },
        ],
      },
    };

    it('parses ergebnis 0 as draw', () => {
      const games = parsePlayerGames(MOCK_PLAYER_JSON);
      expect(games.einzel[0].result).toBe('draw');
      expect(games.einzel[0].roundName).toBe('3. Runde');
      expect(games.einzel[0].roundStageName).toBe('2. Zusatzrunde');
      expect(games.einzel[0].playerIds).toContain(10034);
      expect(games.einzel[0].opponentIds).toContain(10037);
    });

    it('parses ergebnis 1 as win', () => {
      const games = parsePlayerGames(MOCK_PLAYER_JSON);
      expect(games.einzel[1].result).toBe('win');
    });

    it('parses ergebnis 2 as loss', () => {
      const games = parsePlayerGames(MOCK_PLAYER_JSON);
      expect(games.einzel[2].result).toBe('loss');
    });

    it('parses doubles games with both player and opponent pairs', () => {
      const games = parsePlayerGames(MOCK_PLAYER_JSON);
      expect(games.doppel).toHaveLength(1);
      const d = games.doppel[0];
      expect(d.result).toBe('draw');
      expect(d.playerIds).toContain(10034);
      expect(d.playerIds).toContain(9647);
      expect(d.opponentIds).toContain(10120);
      expect(d.opponentIds).toContain(10121);
    });

    it('throws on invalid JSON structure', () => {
      expect(() => parsePlayerGames({})).toThrow('Invalid player JSON');
    });
  });
});
