/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';

describe('authentication token hardening migration', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
  const migration = fs.readFileSync(
    path.join(
      process.cwd(),
      'prisma',
      'migrations',
      '20260809190000_harden_auth_tokens',
      'migration.sql',
    ),
    'utf8',
  );

  it('stores only token hashes and purpose-specific account bindings', () => {
    expect(schema).toMatch(/tokenHash\s+String\s+@unique/);
    expect(schema).toContain('targetEmail String?');
    expect(schema).not.toMatch(/\n\s+token\s+String\s+@unique/);
  });

  it('discards short-lived plaintext tokens before renaming their columns', () => {
    expect(migration).toContain('DELETE FROM "VerificationToken"');
    expect(migration).toContain('DELETE FROM "PasswordResetToken"');
    expect(migration).toContain('DELETE FROM "TwoFactorToken"');
    expect(migration).toContain('RENAME COLUMN "token" TO "tokenHash"');
  });
});
