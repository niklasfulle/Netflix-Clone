/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';

describe('relational integrity migration', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
  const migration = fs.readFileSync(
    path.join(process.cwd(), 'prisma', 'migrations', '20260731120000_relational_integrity', 'migration.sql'),
    'utf8',
  );

  it('defines ownership and media relations with cascade behavior', () => {
    expect(schema).toContain('@@unique([userId, profilId, movieId])');
    expect(schema).toContain('@@unique([playlistId, movieId])');
    expect(migration).toContain('DELETE FROM "MovieWatchTime"');
    expect(migration).toContain('DELETE FROM "PlaylistEntry"');
    expect(migration).toContain('ON DELETE CASCADE');
  });

  it('adds indexes for playback, statistics, and playlist ordering queries', () => {
    expect(migration).toContain('"MovieView_userId_profilId_createdAt_idx"');
    expect(migration).toContain('"MovieWatchTime_profilId_movieId_idx"');
    expect(migration).toContain('"PlaylistEntry_playlistId_order_idx"');
  });
});
