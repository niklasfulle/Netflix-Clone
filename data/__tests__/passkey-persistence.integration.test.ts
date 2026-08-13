/** @jest-environment node */

import { passkeyManagementRepository, passkeyMetadataRepository } from '@/data/passkeys';
import { db } from '@/lib/db';
import { assertIsolatedStagingDatabase } from '@/tests/integration/database-safety';

const databaseTest = process.env.RUN_PASSKEY_DATABASE_INTEGRATION === 'true'
  ? describe
  : describe.skip;

databaseTest('PostgreSQL passkey persistence', () => {
  const suffix = `${process.pid}-${Date.now()}`;
  let userId = '';
  let passkeyOnlyUserId = '';
  const credentialId = `credential-${suffix}`;
  const passkeyOnlyCredentialId = `only-credential-${suffix}`;
  const sessionId = `passkey-session-${suffix}`;

  const createAuthenticator = (input: {
    userId: string;
    credentialID: string;
    providerAccountId: string;
  }) => db.authenticator.create({
    data: {
      ...input,
      credentialPublicKey: `public-key-${input.credentialID}`,
      counter: 0,
      credentialDeviceType: 'multiDevice',
      credentialBackedUp: true,
      transports: 'internal',
    },
  });

  beforeAll(async () => {
    await assertIsolatedStagingDatabase();
    const [passwordUser, passkeyOnlyUser] = await Promise.all([
      db.user.create({
        data: {
          name: 'Passkey Integration User',
          email: `passkey-${suffix}@example.test`,
          emailVerified: new Date(),
          hashedPassword: 'password-recovery-is-configured',
        },
      }),
      db.user.create({
        data: {
          name: 'Passkey Only Integration User',
          email: `passkey-only-${suffix}@example.test`,
          emailVerified: new Date(),
        },
      }),
    ]);
    userId = passwordUser.id;
    passkeyOnlyUserId = passkeyOnlyUser.id;

    await db.authSession.create({
      data: {
        id: sessionId,
        userId,
        issuedAt: new Date('2026-08-12T18:00:00.000Z'),
        expiresAt: new Date('2026-09-12T18:00:00.000Z'),
      },
    });
    await Promise.all([
      createAuthenticator({
        userId,
        credentialID: credentialId,
        providerAccountId: `passkey-account-${suffix}`,
      }),
      createAuthenticator({
        userId: passkeyOnlyUserId,
        credentialID: passkeyOnlyCredentialId,
        providerAccountId: `only-passkey-account-${suffix}`,
      }),
    ]);
  });

  afterAll(async () => {
    await db.user.deleteMany({
      where: { id: { in: [userId, passkeyOnlyUserId].filter(Boolean) } },
    }).catch(() => undefined);
    await db.$disconnect();
  });

  it('atomically records the counter and last-use timestamp', async () => {
    const usedAt = new Date('2026-08-12T18:10:00.000Z');
    await passkeyMetadataRepository.updateCounter(credentialId, 7, usedAt);

    await expect(db.authenticator.findUnique({
      where: { credentialID: credentialId },
      select: { counter: true, lastUsedAt: true },
    })).resolves.toEqual({ counter: 7, lastUsedAt: usedAt });
  });

  it('binds short-lived management grants to a live server session', async () => {
    await passkeyManagementRepository.createGrant({
      tokenHash: `grant-${suffix}`,
      userId,
      sessionId,
      expiresAt: new Date('2026-08-12T18:05:00.000Z'),
    });

    await expect(passkeyManagementRepository.hasActiveGrant(
      `grant-${suffix}`,
      userId,
      sessionId,
      new Date('2026-08-12T18:04:00.000Z'),
    )).resolves.toBe(true);

    await expect(passkeyManagementRepository.hasActiveGrant(
      `grant-${suffix}`,
      userId,
      `other-${sessionId}`,
      new Date('2026-08-12T18:04:00.000Z'),
    )).resolves.toBe(false);

    await db.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date('2026-08-12T18:04:30.000Z') },
    });
    await expect(passkeyManagementRepository.hasActiveGrant(
      `grant-${suffix}`,
      userId,
      sessionId,
      new Date('2026-08-12T18:04:31.000Z'),
    )).resolves.toBe(false);
  });

  it('keeps ownership boundaries and preserves the final sign-in method', async () => {
    await expect(passkeyManagementRepository.rename(
      passkeyOnlyUserId,
      credentialId,
      'Stolen label',
    )).resolves.toBe(false);

    await expect(passkeyManagementRepository.removeRecoverySafe(
      passkeyOnlyUserId,
      passkeyOnlyCredentialId,
    )).resolves.toBe('last_sign_in_method');
    await expect(db.authenticator.findUnique({
      where: { credentialID: passkeyOnlyCredentialId },
    })).resolves.not.toBeNull();

    await expect(passkeyManagementRepository.removeRecoverySafe(
      userId,
      credentialId,
    )).resolves.toBe('removed');
  });

  it('cascades authenticators and management grants when an account is deleted', async () => {
    await db.user.delete({ where: { id: userId } });
    userId = '';

    await expect(db.authenticator.count({
      where: { credentialID: credentialId },
    })).resolves.toBe(0);
    await expect(db.passkeyManagementGrant.count({
      where: { tokenHash: `grant-${suffix}` },
    })).resolves.toBe(0);
  });
});
