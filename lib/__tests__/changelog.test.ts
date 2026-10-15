/** @jest-environment node */

import { getChangelog } from '../changelog';
import { APP_VERSION } from '../version';

describe('published changelog', () => {
  it('keeps the 1.13.1, 1.13.2, and current 1.13.3 releases separate', () => {
    const entries = getChangelog();

    expect(entries.slice(0, 5).map(entry => entry.version)).toEqual([
      APP_VERSION,
      '1.13.2',
      '1.13.1',
      '1.13.0',
      '1.12.1',
    ]);
    expect(entries.find(entry => entry.version === APP_VERSION)?.changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Mobile navigation'),
      ]),
    );
    expect(entries.find(entry => entry.version === '1.13.2')?.changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('live, grouped preview'),
      ]),
    );
    expect(entries.find(entry => entry.version === '1.13.1')?.changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Mobile catalog rows'),
        expect.stringContaining('deployment update'),
      ]),
    );
    expect(entries.find(entry => entry.version === '1.13.0')?.changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Redis runtime'),
        expect.stringContaining('weekly schedules'),
      ]),
    );
    expect(entries.find(entry => entry.version === '1.12.1')?.changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('QR-assisted device login'),
      ]),
    );
    expect(entries.find(entry => entry.version === '1.12.0')?.changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('append-only PostgreSQL audit'),
        expect.stringContaining('media integrity engine'),
        expect.stringContaining('Ed25519-signed Deployment Record'),
      ]),
    );
  });
});
