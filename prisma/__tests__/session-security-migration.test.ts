/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';

describe('session security migration', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
  const migrationPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260812100000_add_session_security',
    'migration.sql',
  );

  it('registers revocable JWT sessions and privacy-safe security activity', () => {
    expect(schema).toContain('model AuthSession');
    expect(schema).toContain('model SecurityActivity');
    expect(schema).toMatch(/sessionsInvalidBefore\s+DateTime\?/);
    expect(schema).not.toContain('ipAddress');
  });

  it('adds indexed session and retention fields without invalidating existing JWTs', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('ADD COLUMN "sessionsInvalidBefore" TIMESTAMP(3)');
    expect(migration).toContain('CREATE TABLE "AuthSession"');
    expect(migration).toContain('CREATE TABLE "SecurityActivity"');
    expect(migration).toContain('"ipHash" TEXT');
    expect(migration).toContain('"revokedAt" TIMESTAMP(3)');
    expect(migration).toContain('"expiresAt" TIMESTAMP(3) NOT NULL');
    expect(migration).toContain('CREATE INDEX "SecurityActivity_userId_createdAt_idx"');
    expect(migration).not.toMatch(/sessionsInvalidBefore[^;]+DEFAULT/);
  });
});
