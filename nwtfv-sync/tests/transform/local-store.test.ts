import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeDataPaths, getLastLocalUpdateDate, listTournamentYearFiles } from '../../src/transform/local-store.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('local-store', () => {
  let tmpDir: string;
  let dataPaths: any;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dyppy-test-'));
    dataPaths = makeDataPaths(tmpDir);
    fs.mkdirSync(dataPaths.tournamentsDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  describe('listTournamentYearFiles', () => {
    it('lists sorted json files in tournaments dir', () => {
      fs.writeFileSync(path.join(dataPaths.tournamentsDir, '2024.json'), '[]');
      fs.writeFileSync(path.join(dataPaths.tournamentsDir, '2023.json'), '[]');
      fs.writeFileSync(path.join(dataPaths.tournamentsDir, 'notayear.txt'), '');

      const files = listTournamentYearFiles(dataPaths);
      expect(files).toEqual(['2023', '2024']);
    });
  });

  describe('getLastLocalUpdateDate', () => {
    it('returns null if no data', () => {
      expect(getLastLocalUpdateDate(dataPaths)).toBeNull();
    });

    it('returns max date across all years', () => {
      fs.writeFileSync(
        path.join(dataPaths.tournamentsDir, '2023.json'),
        JSON.stringify([{ date: '2023-05-10T00:00:00Z' }])
      );
      fs.writeFileSync(
        path.join(dataPaths.tournamentsDir, '2024.json'),
        JSON.stringify([{ date: '2024-01-20T00:00:00Z' }, { date: '2024-02-15T00:00:00Z' }])
      );

      const maxDate = getLastLocalUpdateDate(dataPaths);
      expect(maxDate?.toISOString()).toContain('2024-02-15');
    });
  });
});
