/** @jest-environment node */

import { consumeAuthToken } from '@/data/auth-token';
import { authRateLimitRepository } from '@/data/auth-rate-limit';
import {
  createAuthenticationThrottle,
  hashAuthenticationSubject,
} from '@/lib/authentication/throttle';
import { hashOneTimeToken } from '@/lib/authentication/token-crypto';
import { createSessionSecurity } from '@/lib/authentication/session-security';
import { sessionSecurityRepository } from '@/data/session-security';
import {
  activateMfaAuthenticator,
  consumeMfaChallenge,
  savePendingMfaAuthenticator,
} from '@/data/mfa';
import { db } from '@/lib/db';
import {
  createTotpCode,
  encryptMfaSecret,
  hashRecoveryCode,
} from '@/lib/authentication/mfa-crypto';
import { assertIsolatedStagingDatabase } from '@/tests/integration/database-safety';

const databaseTest = process.env.RUN_AUTH_DATABASE_INTEGRATION === 'true'
  ? describe
  : describe.skip;

databaseTest('PostgreSQL authentication persistence', () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const email = `auth-integration-${suffix}@example.test`;
  const account = `account-${suffix}`;
  const address = `192.0.2.${process.pid % 200}`;
  const throttleSecret = `integration-secret-${suffix}`;
  const windowAccount = `window-account-${suffix}`;
  const windowAddress = `198.51.100.${process.pid % 200}`;
  let userId = '';

  const settings = {
    login: { limit: 2, windowMs: 10_000 },
    register: { limit: 2, windowMs: 10_000 },
    'password-reset': { limit: 2, windowMs: 10_000 },
    'verification-resend': { limit: 2, windowMs: 10_000 },
    'two-factor': { limit: 2, windowMs: 10_000 },
    'two-factor-send': { limit: 1, windowMs: 60_000 },
  } as const;

  beforeAll(async () => {
    await assertIsolatedStagingDatabase();
    const user = await db.user.create({
      data: {
        name: 'Authentication Integration Test',
        email,
        hashedPassword: 'not-a-real-password-hash',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await db.authRateLimit.deleteMany({
      where: {
        subjectHash: {
          in: [account, `${account}-other`, address, windowAccount, windowAddress]
            .map((value) => hashAuthenticationSubject(value, throttleSecret)),
        },
      },
    }).catch(() => undefined);
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it('allows only one concurrent consumer to redeem a persisted token', async () => {
    const rawToken = `raw-token-${suffix}`;
    await db.passwordResetToken.create({
      data: {
        email,
        userId,
        tokenHash: hashOneTimeToken('password-reset', rawToken),
        expires: new Date('2030-01-01T00:00:00.000Z'),
      },
    });

    const results = await Promise.all([
      consumeAuthToken('password-reset', rawToken, new Date('2026-08-09T20:00:00.000Z')),
      consumeAuthToken('password-reset', rawToken, new Date('2026-08-09T20:00:00.000Z')),
    ]);

    expect(results.filter(({ status }) => status === 'valid')).toHaveLength(1);
    expect(results.filter(({ status }) => status === 'invalid')).toHaveLength(1);
  });

  it('rejects wrong-purpose and expired persisted tokens', async () => {
    const wrongPurposeToken = `wrong-purpose-${suffix}`;
    await db.verificationToken.create({
      data: {
        email,
        userId,
        tokenHash: hashOneTimeToken('verification', wrongPurposeToken),
        expires: new Date('2030-01-01T00:00:00.000Z'),
      },
    });
    await expect(consumeAuthToken(
      'password-reset',
      wrongPurposeToken,
      new Date('2026-08-09T20:00:00.000Z'),
    )).resolves.toEqual({ status: 'invalid' });

    const expiredToken = `expired-${suffix}`;
    await db.twoFactorToken.create({
      data: {
        email,
        userId,
        tokenHash: hashOneTimeToken('two-factor', expiredToken),
        expires: new Date('2026-08-09T19:59:59.000Z'),
      },
    });
    await expect(consumeAuthToken(
      'two-factor',
      expiredToken,
      new Date('2026-08-09T20:00:00.000Z'),
      email,
    )).resolves.toEqual({ status: 'expired' });
  });

  it('shares atomic account and IP limits across service instances', async () => {
    const dependencies = {
      repository: authRateLimitRepository,
      clientAddress: async () => address,
      secret: throttleSecret,
      settings,
      now: () => new Date('2026-08-09T20:00:00.000Z'),
    };
    const firstInstance = createAuthenticationThrottle(dependencies);
    const restartedInstance = createAuthenticationThrottle(dependencies);

    const attempts = await Promise.all([
      firstInstance.consume('login', account),
      restartedInstance.consume('login', account),
      firstInstance.consume('login', account),
      restartedInstance.consume('login', account),
    ]);

    expect(attempts.filter(({ allowed }) => allowed)).toHaveLength(2);
    await firstInstance.release('login', account);
    expect((await restartedInstance.consume('login', `${account}-other`)).allowed).toBe(false);
  });

  it('opens a new SQL window and removes expired buckets in bounded cleanup', async () => {
    let now = new Date('2026-08-09T20:00:00.000Z');
    const throttle = createAuthenticationThrottle({
      repository: authRateLimitRepository,
      clientAddress: async () => windowAddress,
      secret: throttleSecret,
      settings: { ...settings, login: { limit: 1, windowMs: 10_000 } },
      now: () => now,
    });
    const staleBucket = {
      scope: `stale-${suffix}`,
      subjectType: 'account',
      subjectHash: `stale-hash-${suffix}`,
    };
    await db.authRateLimit.create({
      data: {
        ...staleBucket,
        attempts: 1,
        resetAt: new Date('2026-08-09T19:59:59.000Z'),
      },
    });

    expect((await throttle.consume('login', windowAccount)).allowed).toBe(true);
    expect((await throttle.consume('login', windowAccount)).allowed).toBe(false);
    now = new Date('2026-08-09T20:00:10.001Z');
    expect((await throttle.consume('login', windowAccount)).allowed).toBe(true);
    await expect(db.authRateLimit.findUnique({
      where: { scope_subjectType_subjectHash: staleBucket },
    })).resolves.toBeNull();
  });

  it('revokes concurrent device sessions and rejects pre-cutoff legacy JWTs', async () => {
    const sessionIds = [`current-${suffix}`, `other-${suffix}`];
    const security = createSessionSecurity({
      repository: sessionSecurityRepository,
      now: () => new Date('2026-08-12T10:00:00.000Z'),
      createId: () => sessionIds.shift() as string,
      hashAddress: () => `opaque-ip-hash-${suffix}`,
    });
    const sessionInput = {
      userId,
      issuedAt: new Date('2026-08-12T09:00:00.000Z'),
      expiresAt: new Date('2026-09-12T10:00:00.000Z'),
      context: { address: '192.0.2.200', userAgent: 'Integration Browser' },
    };

    const current = await security.authenticate(sessionInput);
    const other = await security.authenticate(sessionInput);
    expect(current).toEqual({ status: 'active', sessionId: `current-${suffix}` });
    expect(other).toEqual({ status: 'active', sessionId: `other-${suffix}` });

    await security.revokeOtherSessions({
      userId,
      currentSessionId: `current-${suffix}`,
    });

    await expect(security.isAuthorized({
      userId,
      sessionId: `current-${suffix}`,
      issuedAt: sessionInput.issuedAt,
    })).resolves.toBe(true);
    await expect(security.isAuthorized({
      userId,
      sessionId: `other-${suffix}`,
      issuedAt: sessionInput.issuedAt,
    })).resolves.toBe(false);
    await expect(security.isAuthorized({
      userId,
      issuedAt: new Date('2026-08-12T09:59:59.000Z'),
    })).resolves.toBe(false);

    const stored = await db.authSession.findUnique({
      where: { id: `current-${suffix}` },
      select: { ipHash: true, userAgent: true },
    });
    expect(stored).toEqual({
      ipHash: `opaque-ip-hash-${suffix}`,
      userAgent: 'Integration Browser',
    });
    expect(JSON.stringify(stored)).not.toContain('192.0.2.200');
  });

  it('atomically rejects replayed TOTP windows and consumed recovery codes', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const now = new Date('2026-08-12T20:00:00.000Z');
    const recoveryCode = 'ABCD-EFGH-JKLM';
    await savePendingMfaAuthenticator(userId, encryptMfaSecret(secret));
    await expect(activateMfaAuthenticator(
      userId,
      BigInt(0),
      [hashRecoveryCode(userId, recoveryCode)],
      new Date('2026-08-12T19:59:00.000Z'),
    )).resolves.toBe(true);

    const totpCode = createTotpCode(secret, now);
    const totpResults = await Promise.all([
      consumeMfaChallenge(userId, totpCode, now),
      consumeMfaChallenge(userId, totpCode, now),
    ]);
    expect(totpResults.filter((result) => result === 'totp')).toHaveLength(1);
    expect(totpResults.filter((result) => result === null)).toHaveLength(1);

    const recoveryResults = await Promise.all([
      consumeMfaChallenge(userId, recoveryCode, now),
      consumeMfaChallenge(userId, recoveryCode, now),
    ]);
    expect(recoveryResults.filter((result) => result === 'recovery')).toHaveLength(1);
    expect(recoveryResults.filter((result) => result === null)).toHaveLength(1);
  });
});
