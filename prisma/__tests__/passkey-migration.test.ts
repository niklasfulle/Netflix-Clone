/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';

describe('passkey migration', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
  const migrationPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260812183000_add_passkeys',
    'migration.sql',
  );

  it('adds Auth.js authenticators and session-bound management grants', () => {
    expect(schema).toContain('model Authenticator');
    expect(schema).toMatch(/credentialID\s+String/);
    expect(schema).toMatch(/credentialPublicKey\s+String/);
    expect(schema).toContain('model PasskeyManagementGrant');
    expect(schema).toMatch(/sessionId\s+String/);
  });

  it('enforces unique credentials and cascading ownership in PostgreSQL', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('CREATE TABLE "Authenticator"');
    expect(migration).toContain('CREATE UNIQUE INDEX "Authenticator_credentialID_key"');
    expect(migration).toContain('CREATE TABLE "PasskeyManagementGrant"');
    expect(migration).toContain('ON DELETE CASCADE ON UPDATE CASCADE');
  });
});
