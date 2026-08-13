/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';

describe('persistent authentication rate-limit migration', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
  const migrationPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260809200000_persist_auth_rate_limits',
    'migration.sql',
  );

  it('defines a unique scope and subject bucket with an expiry index', () => {
    expect(schema).toContain('model AuthRateLimit');
    expect(schema).toContain('@@id([scope, subjectType, subjectHash])');
    expect(schema).toContain('@@index([resetAt])');
  });

  it('creates the production table without changing existing authentication data', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('CREATE TABLE "AuthRateLimit"');
    expect(migration).toContain('PRIMARY KEY ("scope", "subjectType", "subjectHash")');
    expect(migration).not.toMatch(/DELETE FROM "User"|DROP TABLE "User"/);
  });
});
