/** @jest-environment node */

import { getChangelog } from '../changelog';

describe('published changelog', () => {
  it('keeps the 1.12 release line separate from the current release', () => {
    const entries = getChangelog();

    expect(entries.slice(0, 4).map(entry => entry.version)).toEqual([
      '1.13.0',
      '1.12.1',
      '1.12.0',
      '1.11.0',
    ]);
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
