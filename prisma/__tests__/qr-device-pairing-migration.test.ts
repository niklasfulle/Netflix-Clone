/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';

describe('QR device pairing migration', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
  const migrationPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260821130000_add_qr_device_pairing',
    'migration.sql',
  );

  it('models short-lived pairing requests with explicit terminal states', () => {
    expect(schema).toContain('enum QrDevicePairingStatus');
    expect(schema).toContain('model QrDevicePairingRequest');
    expect(schema).toContain('model RecentAuthenticationGrant');
    expect(schema).toMatch(/approvalSecretHash\s+String\s+@unique/);
    expect(schema).toMatch(/pollSecretHash\s+String\s+@unique/);
    expect(schema).toMatch(/expiresAt\s+DateTime/);
    expect(schema).not.toContain('rawApprovalSecret');
    expect(schema).not.toContain('rawPollSecret');
  });

  it('adds indexed secret hashes and expiry without a secret default', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('CREATE TYPE "QrDevicePairingStatus"');
    expect(migration).toContain('CREATE TABLE "QrDevicePairingRequest"');
    expect(migration).toContain('CREATE TABLE "RecentAuthenticationGrant"');
    expect(migration).toContain('"approvalSecretHash" TEXT NOT NULL');
    expect(migration).toContain('"pollSecretHash" TEXT NOT NULL');
    expect(migration).toContain('CREATE UNIQUE INDEX "QrDevicePairingRequest_approvalSecretHash_key"');
    expect(migration).toContain('CREATE INDEX "QrDevicePairingRequest_status_expiresAt_idx"');
    expect(migration).toContain('CREATE UNIQUE INDEX "RecentAuthenticationGrant_userId_sessionId_key"');
    expect(migration).not.toMatch(/"(?:manualCodeHash|approvalSecretHash|pollSecretHash)"[^,\n]*DEFAULT/);
  });
});
