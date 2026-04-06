import { describe, it, expect } from 'vitest';
import { splitName, findPlayerMatch, patchTournamentCompetitors } from '../../src/transform/reconcile.js';

describe('reconcile', () => {
  describe('splitName', () => {
    it('splits standard Surname, Name correctly', () => {
      expect(splitName('Slobozheniuk, Evgenii')).toEqual({
        surname: 'Slobozheniuk',
        name: 'Evgenii'
      });
    });

    it('handles names without commas', () => {
      expect(splitName('Evgenii Slobozheniuk')).toEqual({
        surname: 'Evgenii',
        name: 'Slobozheniuk'
      });
    });

    it('handles single names', () => {
      expect(splitName('Evgenii')).toEqual({
        surname: '',
        name: 'Evgenii'
      });
    });
  });

  describe('findPlayerMatch', () => {
    const entries = [
      { id: 100, tokens: new Set(['hans', 'mueller']) },
      { id: 200, tokens: new Set(['evgenii', 'slobozheniuk']) }
    ];

    it('matches valid names', () => {
      expect(findPlayerMatch('Slobozheniuk, Evgenii', entries)).toBe(200);
      expect(findPlayerMatch('Hans Mueller', entries)).toBe(100);
    });

    it('requires at least 2 tokens', () => {
      expect(findPlayerMatch('Mueller', entries)).toBeUndefined();
    });

    it('returns undefined if tokens do not match', () => {
      expect(findPlayerMatch('Hans Schmidt', entries)).toBeUndefined();
    });
  });

  describe('patchTournamentCompetitors', () => {
    it('patches nwtfvId on matching competitors', () => {
      const tournament = {
        mainRound: {
          finalPlacements: [
            { competitor: { type: 'player', player: { name: 'Slobozheniuk, Evgenii' } } }
          ]
        }
      };

      const entries = [
        { id: 200, tokens: new Set(['evgenii', 'slobozheniuk']) }
      ];

      const count = patchTournamentCompetitors(tournament, entries);
      expect(count).toBe(1);
      expect(tournament.mainRound.finalPlacements[0].competitor.player.nwtfvId).toBe(200);
    });
  });
});
