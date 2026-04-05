import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAvailableYears, fetchTournamentGroupsHTML } from '../src/fetch.js';
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

      // First call for fetchAvailableYears, second for the POST request
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
      // Unstub global fetch for this specific test to allow real network requests
      vi.unstubAllGlobals();

      const html = await fetchTournamentGroupsHTML(2025);

      expect(html).toContain('<option value="20" selected>2025</option>');
      expect(html.length).toBeGreaterThan(1000);
    });
  });
});
