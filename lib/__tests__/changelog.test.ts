/** @jest-environment node */

import { getChangelog, parseChangelog } from '../changelog';
import { APP_VERSION } from '../version';

describe('published changelog', () => {
  it('ignores unversioned notes and parses current and explicit releases with either newline format', () => {
    expect(parseChangelog('- unversioned\r\n## [CURRENT]\r\n- New behavior\r\n\r\n## 1.2.3\r\n- Earlier behavior\r\nAdditional prose')).toEqual([
      { version: APP_VERSION, changes: ['New behavior'] },
      { version: '1.2.3', changes: ['Earlier behavior'] },
    ]);
    expect(parseChangelog('')).toEqual([]);
  });
  it('keeps the current release and previous published releases separate', () => {
    const entries = getChangelog();

    expect(entries.slice(0, 5).map(entry => entry.version)).toEqual([
      APP_VERSION,
      '1.14.2',
      '1.14.1',
      '1.14.0',
      '1.13.6',
    ]);
    expect(entries.find(entry => entry.version === APP_VERSION)?.changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Anzahl unterschiedlicher Kategorien'),
        expect.stringContaining('dauerhafte Farben'),
        expect.stringContaining('manuellen Kategorisierung'),
      ]),
    );
    expect(entries.find(entry => entry.version === '1.14.2')?.changes).toEqual(
      expect.arrayContaining([expect.stringContaining('Kategorienverwaltung')]),
    );
    const previousPatch = entries.find(entry => entry.version === '1.14.1')?.changes ?? [];
    expect(previousPatch).toEqual(expect.arrayContaining([
      expect.stringContaining('Turbopack-Buildcache'),
      expect.stringContaining('Thumbnail-Auswahl'),
      expect.stringContaining('Darstellerauswahl'),
    ]));
    expect(previousPatch.join('\n')).not.toContain('Kategorienverwaltung');
    expect(entries.find(entry => entry.version === '1.14.0')?.changes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Videoplayer'),
        expect.stringContaining('Playlist-Karten'),
        expect.stringContaining('Docker-Compose'),
        expect.stringContaining('Seed'),
        expect.stringContaining('Profilbilder'),
      ]),
    );
    expect(entries.find(entry => entry.version === '1.13.6')?.changes).toEqual(
      expect.arrayContaining([expect.stringContaining('automatische Playlist „Favoriten“')]),
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
