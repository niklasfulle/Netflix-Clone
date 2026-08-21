import {
  createAuthenticationService,
  type AuthenticationDependencies,
} from '../service';
import {
  createAuthenticationTelemetry,
  type AuthenticationTelemetryRecord,
} from '../telemetry';

type DependencyOverrides = {
  [Key in keyof AuthenticationDependencies]?: Partial<AuthenticationDependencies[Key]>;
};

const createTelemetry = (records: AuthenticationTelemetryRecord[] = []) => {
  const times = [
    new Date('2026-08-20T18:00:00.000Z'),
    new Date('2026-08-20T18:00:00.125Z'),
  ];
  return createAuthenticationTelemetry({
    write: (record) => records.push(record),
    now: () => times.shift() ?? new Date('2026-08-20T18:00:00.125Z'),
    randomUUID: () => '018f48d8-8ba1-7dd9-8000-000000000001',
    environment: 'test',
    version: '1.12.0-rc.1',
  });
};

const defaultDependencies: AuthenticationDependencies = {
  users: {
    findByEmail: async () => ({
      id: 'user-1',
      email: 'viewer@example.com',
      hashedPassword: 'stored-hash',
      emailVerified: new Date('2026-08-01T10:00:00.000Z'),
      isTwoFactorEnabled: false,
    }),
    findById: async () => ({
      id: 'user-1',
      email: 'viewer@example.com',
      hashedPassword: 'stored-hash',
      emailVerified: new Date('2026-08-01T10:00:00.000Z'),
      isTwoFactorEnabled: false,
    }),
    create: async () => ({ created: true, userId: 'user-1' }),
    updatePassword: async () => undefined,
    verifyEmail: async () => true,
  },
  passwords: {
    hash: async (password) => `hashed:${password}`,
    verify: async () => true,
  },
  throttle: {
    consume: async () => ({
      allowed: true,
      retryAfterSeconds: 0,
      keyHash: 'identity-hash',
    }),
    release: async () => undefined,
  },
  tokens: {
    issueVerification: async () => ({ email: 'viewer@example.com', token: 'token' }),
    issuePasswordReset: async () => ({ email: 'viewer@example.com', token: 'reset-token' }),
    issueTwoFactor: async () => ({ email: 'viewer@example.com', token: '123456' }),
    consumeTwoFactor: async () => ({ status: 'invalid' }),
    consumePasswordReset: async () => ({ status: 'invalid' }),
    consumeVerification: async () => ({ status: 'invalid' }),
  },
  mail: {
    sendVerification: async () => undefined,
    sendPasswordReset: async () => undefined,
    sendTwoFactor: async () => undefined,
  },
  session: {
    signInCredentials: async () => undefined,
    isRedirectError: () => false,
  },
  telemetry: createTelemetry(),
  audit: { log: () => undefined },
  confirmations: { replaceForUser: async () => undefined },
  mfa: { consumeChallenge: async () => null },
  security: { revokeAllSessions: async () => undefined },
  clock: { now: () => new Date('2026-08-09T17:00:00.000Z') },
};

const createDependencies = (overrides: DependencyOverrides = {}): AuthenticationDependencies => ({
  users: { ...defaultDependencies.users, ...overrides.users },
  passwords: { ...defaultDependencies.passwords, ...overrides.passwords },
  throttle: { ...defaultDependencies.throttle, ...overrides.throttle },
  tokens: { ...defaultDependencies.tokens, ...overrides.tokens },
  mail: { ...defaultDependencies.mail, ...overrides.mail },
  session: { ...defaultDependencies.session, ...overrides.session },
  telemetry: { ...defaultDependencies.telemetry, ...overrides.telemetry },
  audit: { ...defaultDependencies.audit, ...overrides.audit },
  confirmations: { ...defaultDependencies.confirmations, ...overrides.confirmations },
  mfa: { ...defaultDependencies.mfa, ...overrides.mfa },
  security: { ...defaultDependencies.security, ...overrides.security },
  clock: { ...defaultDependencies.clock, ...overrides.clock },
});

describe('authentication service', () => {
  it('rejects an invalid login command with a stable result code', async () => {
    const service = createAuthenticationService(createDependencies());

    await expect(service.login({ email: 'not-an-email', password: '' })).resolves.toEqual({
      status: 'rejected',
      code: 'invalid_fields',
    });
  });

  it('rejects credentials for an unknown account without exposing account state', async () => {
    const records: AuthenticationTelemetryRecord[] = [];
    const service = createAuthenticationService(createDependencies({
      users: { findByEmail: async () => null },
      telemetry: createTelemetry(records),
    }));

    await expect(
      service.login({ email: 'unknown@example.com', password: 'password123' }),
    ).resolves.toEqual({ status: 'rejected', code: 'invalid_credentials' });
    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({
      action: 'auth.login.completed',
      level: 'info',
      flow: 'login',
      stage: 'credentials',
      outcome: 'rejected',
      reasonCode: 'invalid_credentials',
      retryable: false,
    });
    const serialized = JSON.stringify(records);
    expect(serialized).not.toContain('unknown@example.com');
    expect(serialized).not.toContain('password123');
    expect(serialized).not.toContain('identity-hash');
  });

  it('records a database category without serializing the thrown login error', async () => {
    const records: AuthenticationTelemetryRecord[] = [];
    const databaseError = new Error('query failed for viewer@example.com');
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => {
          throw databaseError;
        },
      },
      telemetry: createTelemetry(records),
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'password123' }),
    ).rejects.toBe(databaseError);
    expect(records[1]).toMatchObject({
      action: 'auth.login.completed',
      level: 'error',
      stage: 'credentials',
      outcome: 'failed',
      reasonCode: 'unexpected_failure',
      errorCategory: 'database',
      retryable: true,
    });
    const serialized = JSON.stringify(records);
    expect(serialized).not.toContain('viewer@example.com');
    expect(serialized).not.toContain('query failed');
  });

  it('signs in a verified credential account through the normalized identity', async () => {
    const signInAttempts: Array<{ email: string; password: string }> = [];
    const service = createAuthenticationService(createDependencies({
      session: {
        signInCredentials: async (credentials) => {
          signInAttempts.push(credentials);
        },
      },
    }));

    await expect(
      service.login({ email: ' Viewer@Example.COM ', password: 'password123' }),
    ).resolves.toEqual({ status: 'success', code: 'signed_in' });
    expect(signInAttempts).toEqual([
      { email: 'viewer@example.com', password: 'password123' },
    ]);
  });

  it('keeps legacy login audit events free of identities and throttle fingerprints', async () => {
    const auditEvents: Array<{ event: string; context: Record<string, unknown> }> = [];
    const audit = {
      log: (event: string, context: Record<string, unknown>) => {
        auditEvents.push({ event, context });
      },
    };

    await createAuthenticationService(createDependencies({ audit })).login({
      email: 'viewer@example.com',
      password: 'password123',
    });
    await createAuthenticationService(createDependencies({
      audit,
      throttle: {
        consume: async () => ({
          allowed: false,
          retryAfterSeconds: 420,
          keyHash: 'sensitive-identity-fingerprint',
        }),
      },
    })).login({ email: 'viewer@example.com', password: 'password123' });
    await createAuthenticationService(createDependencies({
      audit,
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
        }),
      },
      tokens: { consumeTwoFactor: async () => ({ status: 'invalid' }) },
    })).login({
      email: 'viewer@example.com',
      password: 'password123',
      code: '654321',
    });
    await createAuthenticationService(createDependencies({
      audit,
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: null,
          isTwoFactorEnabled: false,
        }),
      },
    })).login({ email: 'viewer@example.com', password: 'password123' });

    expect(auditEvents.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(auditEvents);
    expect(serialized).not.toContain('viewer@example.com');
    expect(serialized).not.toContain('sensitive-identity-fingerprint');
    expect(serialized).not.toContain('user-1');
  });

  it('returns retry metadata when a login identity is throttled', async () => {
    const service = createAuthenticationService(createDependencies({
      throttle: {
        consume: async () => ({
          allowed: false,
          retryAfterSeconds: 420,
          keyHash: 'identity-hash',
        }),
      },
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'password123' }),
    ).resolves.toEqual({
      status: 'retry',
      code: 'rate_limited',
      retryAfterSeconds: 420,
    });
  });

  it('returns a verification-sent result for an unverified credential account', async () => {
    const delivered: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: null,
          isTwoFactorEnabled: false,
        }),
      },
      tokens: {
        issueVerification: async () => ({
          email: 'viewer@example.com',
          token: 'verification-token',
        }),
      },
      mail: {
        sendVerification: async (message) => {
          delivered.push(message);
        },
      },
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'password123' }),
    ).resolves.toEqual({ status: 'success', code: 'verification_sent' });
    expect(delivered).toEqual([
      { email: 'viewer@example.com', token: 'verification-token' },
    ]);
  });

  it('does not send verification email when an unverified account supplies a wrong password', async () => {
    const delivered: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: null,
          isTwoFactorEnabled: false,
        }),
      },
      passwords: { verify: async () => false },
      mail: {
        sendVerification: async (message) => {
          delivered.push(message);
        },
      },
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'wrong-password' }),
    ).resolves.toEqual({ status: 'rejected', code: 'invalid_credentials' });
    expect(delivered).toEqual([]);
  });

  it('rejects blocked accounts without sending a two-factor challenge', async () => {
    const delivered: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
          isBlocked: true,
        }),
      },
      mail: {
        sendTwoFactor: async (message) => {
          delivered.push(message);
        },
      },
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'password123' }),
    ).resolves.toEqual({ status: 'rejected', code: 'invalid_credentials' });
    expect(delivered).toEqual([]);
  });

  it('returns an email OTP challenge for a verified account with two-factor enabled', async () => {
    const deliveredCodes: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
        }),
      },
      mail: {
        sendTwoFactor: async (message) => {
          deliveredCodes.push(message);
        },
      },
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'password123' }),
    ).resolves.toEqual({
      status: 'challenge',
      code: 'two_factor_required',
      challenge: 'email_otp',
      maskedDestination: 'v***r@example.com',
      expiresInSeconds: 600,
      resendAfterSeconds: 60,
    });
    expect(deliveredCodes).toEqual([{ email: 'viewer@example.com', token: '123456' }]);
  });

  it('returns a dedicated authenticator challenge without sending email', async () => {
    const deliveredCodes: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
          hasVerifiedAuthenticator: true,
        }),
      },
      mail: {
        sendTwoFactor: async (message) => {
          deliveredCodes.push(message);
        },
      },
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'password123' }),
    ).resolves.toEqual({
      status: 'challenge',
      code: 'two_factor_required',
      challenge: 'totp',
      canUseEmailFallback: true,
    });
    expect(deliveredCodes).toEqual([]);
  });

  it('consumes a one-time recovery code through the authenticator challenge', async () => {
    const consumed: Array<{ userId: string; code: string }> = [];
    const confirmations: string[] = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
          hasVerifiedAuthenticator: true,
        }),
      },
      mfa: {
        consumeChallenge: async (userId, code) => {
          consumed.push({ userId, code });
          return 'recovery';
        },
      },
      confirmations: {
        replaceForUser: async (userId) => {
          confirmations.push(userId);
        },
      },
    }));

    await expect(service.login({
      email: 'viewer@example.com',
      password: 'password123',
      code: 'AAAA-BBBB-CCCC',
      challengeMethod: 'totp',
    })).resolves.toEqual({ status: 'success', code: 'signed_in' });
    expect(consumed).toEqual([{ userId: 'user-1', code: 'AAAA-BBBB-CCCC' }]);
    expect(confirmations).toEqual(['user-1']);
  });

  it('sends an email OTP only when the authenticator fallback is requested', async () => {
    const deliveredCodes: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
          hasVerifiedAuthenticator: true,
        }),
      },
      mail: {
        sendTwoFactor: async (message) => {
          deliveredCodes.push(message);
        },
      },
    }));

    await expect(service.login({
      email: 'viewer@example.com',
      password: 'password123',
      challengeMethod: 'email_otp',
    })).resolves.toEqual({
      status: 'challenge',
      code: 'two_factor_required',
      challenge: 'email_otp',
      maskedDestination: 'v***r@example.com',
      expiresInSeconds: 600,
      resendAfterSeconds: 60,
    });
    expect(deliveredCodes).toEqual([{ email: 'viewer@example.com', token: '123456' }]);
  });

  it('rejects an invalid email OTP with a stable result code', async () => {
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
        }),
      },
      tokens: {
        consumeTwoFactor: async () => ({ status: 'invalid' }),
      },
    }));

    await expect(
      service.login({
        email: 'viewer@example.com',
        password: 'password123',
        code: '654321',
      }),
    ).resolves.toEqual({ status: 'rejected', code: 'invalid_code' });
  });

  it('rejects an expired email OTP without creating a confirmation', async () => {
    const confirmations: string[] = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
        }),
      },
      tokens: {
        consumeTwoFactor: async () => ({ status: 'expired' }),
      },
      confirmations: {
        replaceForUser: async (userId) => {
          confirmations.push(userId);
        },
      },
    }));

    await expect(
      service.login({
        email: 'viewer@example.com',
        password: 'password123',
        code: '123456',
      }),
    ).resolves.toEqual({ status: 'rejected', code: 'code_expired' });
    expect(confirmations).toEqual([]);
  });

  it('consumes a valid email OTP before signing in', async () => {
    const confirmations: string[] = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: new Date('2026-08-01T10:00:00.000Z'),
          isTwoFactorEnabled: true,
        }),
      },
      tokens: {
        consumeTwoFactor: async () => ({
          status: 'valid',
          email: 'viewer@example.com',
          userId: 'user-1',
        }),
      },
      confirmations: {
        replaceForUser: async (userId) => {
          confirmations.push(userId);
        },
      },
    }));

    await expect(
      service.login({
        email: 'viewer@example.com',
        password: 'password123',
        code: '123456',
      }),
    ).resolves.toEqual({ status: 'success', code: 'signed_in' });
    expect(confirmations).toEqual(['user-1']);
  });

  it('returns a stable result when the session adapter rejects credentials', async () => {
    const service = createAuthenticationService(createDependencies({
      session: {
        signInCredentials: async () => {
          throw new Error('credentials rejected');
        },
      },
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'wrong-password' }),
    ).resolves.toEqual({ status: 'rejected', code: 'auth_failed' });
  });

  it('rethrows framework redirects after releasing the login throttle', async () => {
    const redirect = new Error('NEXT_REDIRECT');
    const released: Array<{ scope: string; identity: string }> = [];
    const service = createAuthenticationService(createDependencies({
      throttle: {
        release: async (scope, identity) => {
          released.push({ scope, identity });
        },
      },
      session: {
        signInCredentials: async () => {
          throw redirect;
        },
        isRedirectError: (error) => error === redirect,
      },
    }));

    await expect(
      service.login({ email: 'viewer@example.com', password: 'password123' }),
    ).rejects.toBe(redirect);
    expect(released).toEqual([{ scope: 'login', identity: 'viewer@example.com' }]);
  });

  it('registers a normalized account and requests email verification', async () => {
    const createdAccounts: Array<{ name: string; email: string; hashedPassword: string }> = [];
    const delivered: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => null,
        create: async (account) => {
          createdAccounts.push(account);
          return { created: true, userId: 'user-1' };
        },
      },
      passwords: {
        hash: async (password) => `hashed:${password}`,
      },
      mail: {
        sendVerification: async (message) => {
          delivered.push(message);
        },
      },
    }));

    await expect(service.register({
      name: 'Viewer',
      email: ' Viewer@Example.COM ',
      password: 'password1234',
      confirm: 'password1234',
    })).resolves.toEqual({ status: 'success', code: 'verification_sent' });
    expect(createdAccounts).toEqual([{
      name: 'Viewer',
      email: 'viewer@example.com',
      hashedPassword: 'hashed:password1234',
    }]);
    expect(delivered).toEqual([{ email: 'viewer@example.com', token: 'token' }]);
  });

  it('records a privacy-safe registration attempt without legacy identity metadata', async () => {
    const records: AuthenticationTelemetryRecord[] = [];
    const auditEvents: Array<{ event: string; context: Record<string, unknown> }> = [];
    const service = createAuthenticationService(createDependencies({
      users: { findByEmail: async () => null },
      telemetry: createTelemetry(records),
      audit: {
        log: (event, context) => {
          auditEvents.push({ event, context });
        },
      },
    }));

    await expect(service.register({
      name: 'Private Viewer',
      email: 'private.viewer@example.com',
      password: 'private-password123',
      confirm: 'private-password123',
    })).resolves.toEqual({ status: 'success', code: 'verification_sent' });

    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({
      action: 'auth.registration.completed',
      flow: 'registration',
      stage: 'mail',
      outcome: 'success',
      reasonCode: 'verification_sent',
    });
    expect(auditEvents).toContainEqual({ event: 'register_success', context: {} });
    const serialized = JSON.stringify({ records, auditEvents });
    expect(serialized).not.toContain('Private Viewer');
    expect(serialized).not.toContain('private.viewer@example.com');
    expect(serialized).not.toContain('private-password123');
    expect(serialized).not.toContain('identity-hash');
  });

  it('handles a concurrent duplicate registration without leaking or throwing', async () => {
    const delivered: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => null,
        create: async () => ({ created: false }),
      },
      mail: {
        sendVerification: async (message) => {
          delivered.push(message);
        },
      },
    }));

    await expect(service.register({
      name: 'Viewer',
      email: 'viewer@example.com',
      password: 'password1234',
      confirm: 'password1234',
    })).resolves.toEqual({ status: 'success', code: 'verification_sent' });
    expect(delivered).toEqual([]);
  });

  it('returns a controlled result when verification mail delivery fails', async () => {
    const auditEvents: Array<{ event: string; context: Record<string, unknown> }> = [];
    const service = createAuthenticationService(createDependencies({
      users: { findByEmail: async () => null },
      mail: {
        sendVerification: async () => {
          throw new Error('smtp unavailable');
        },
      },
      audit: {
        log: (event, context) => {
          auditEvents.push({ event, context });
        },
      },
    }));

    await expect(service.register({
      name: 'Viewer',
      email: 'viewer@example.com',
      password: 'password1234',
      confirm: 'password1234',
    })).resolves.toEqual({ status: 'rejected', code: 'delivery_failed' });
    expect(auditEvents).toContainEqual({
      event: 'auth_mail_delivery_failed',
      context: { kind: 'verification' },
    });
  });

  it('accepts a password-reset request and delivers a token for an existing account', async () => {
    const delivered: Array<{ email: string; token: string }> = [];
    const service = createAuthenticationService(createDependencies({
      tokens: {
        issuePasswordReset: async (email) => ({ email, token: 'reset-token' }),
      },
      mail: {
        sendPasswordReset: async (message) => {
          delivered.push(message);
        },
      },
    }));

    await expect(service.requestPasswordReset({ email: ' Viewer@Example.COM ' }))
      .resolves.toEqual({ status: 'success', code: 'password_reset_sent' });
    expect(delivered).toEqual([{ email: 'viewer@example.com', token: 'reset-token' }]);
  });

  it('keeps password-reset enumeration safe while recording a mail failure', async () => {
    const records: AuthenticationTelemetryRecord[] = [];
    const service = createAuthenticationService(createDependencies({
      telemetry: createTelemetry(records),
      mail: {
        sendPasswordReset: async () => {
          throw new Error('SMTP rejected reset for viewer@example.com');
        },
      },
    }));

    await expect(service.requestPasswordReset({ email: 'viewer@example.com' }))
      .resolves.toEqual({ status: 'success', code: 'password_reset_sent' });
    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({
      action: 'auth.password_reset_request.completed',
      flow: 'password_reset_request',
      stage: 'mail',
      outcome: 'failed',
      reasonCode: 'delivery_failed',
      errorCategory: 'mail',
      retryable: true,
    });
    expect(JSON.stringify(records)).not.toContain('viewer@example.com');
    expect(JSON.stringify(records)).not.toContain('SMTP rejected');
  });

  it('resends verification to a known unverified account with a fresh bound token', async () => {
    const delivered: Array<{ email: string; token: string }> = [];
    const issued: Array<{ email: string; userId?: string }> = [];
    const service = createAuthenticationService(createDependencies({
      users: {
        findByEmail: async () => ({
          id: 'user-1',
          email: 'viewer@example.com',
          hashedPassword: 'stored-hash',
          emailVerified: null,
          isTwoFactorEnabled: false,
        }),
      },
      tokens: {
        issueVerification: async (email, binding) => {
          issued.push({ email, userId: binding?.userId });
          return { email, token: 'fresh-verification-token' };
        },
      },
      mail: {
        sendVerification: async (message) => {
          delivered.push(message);
        },
      },
    }));

    await expect(service.resendVerification({ email: ' Viewer@Example.com ' }))
      .resolves.toEqual({ status: 'success', code: 'verification_sent' });
    expect(issued).toEqual([{ email: 'viewer@example.com', userId: 'user-1' }]);
    expect(delivered).toEqual([{
      email: 'viewer@example.com',
      token: 'fresh-verification-token',
    }]);
  });

  it('keeps verification resend enumeration-safe for an unknown account', async () => {
    const sendVerification = jest.fn();
    const service = createAuthenticationService(createDependencies({
      users: { findByEmail: async () => null },
      mail: { sendVerification },
    }));

    await expect(service.resendVerification({ email: 'missing@example.com' }))
      .resolves.toEqual({ status: 'success', code: 'verification_sent' });
    expect(sendVerification).not.toHaveBeenCalled();
  });

  it('records verification resend as one privacy-safe attempt', async () => {
    const records: AuthenticationTelemetryRecord[] = [];
    const service = createAuthenticationService(createDependencies({
      users: { findByEmail: async () => null },
      telemetry: createTelemetry(records),
    }));

    await expect(service.resendVerification({ email: 'missing@example.com' }))
      .resolves.toEqual({ status: 'success', code: 'verification_sent' });
    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({
      action: 'auth.verification_resend.completed',
      flow: 'verification_resend',
      stage: 'account',
      outcome: 'success',
      reasonCode: 'verification_sent',
    });
    expect(JSON.stringify(records)).not.toContain('missing@example.com');
  });

  it('sets a new password with a valid reset token', async () => {
    const updatedPasswords: Array<{ userId: string; hashedPassword: string }> = [];
    const revokeAllSessions = jest.fn();
    const service = createAuthenticationService(createDependencies({
      tokens: {
        consumePasswordReset: async () => ({
          status: 'valid',
          email: 'viewer@example.com',
          userId: 'user-1',
        }),
      },
      users: {
        updatePassword: async (userId, hashedPassword) => {
          updatedPasswords.push({ userId, hashedPassword });
        },
      },
      security: { revokeAllSessions },
    }));

    await expect(service.setNewPassword({
      token: 'reset-token',
      password: 'new-password123',
      confirm: 'new-password123',
    })).resolves.toEqual({ status: 'success', code: 'password_updated' });
    expect(updatedPasswords).toEqual([{
      userId: 'user-1',
      hashedPassword: 'hashed:new-password123',
    }]);
    expect(revokeAllSessions).toHaveBeenCalledWith('user-1', 'password_reset');
  });

  it('rejects a missing password-reset token with a stable result code', async () => {
    const records: AuthenticationTelemetryRecord[] = [];
    const service = createAuthenticationService(createDependencies({
      telemetry: createTelemetry(records),
    }));

    await expect(service.setNewPassword({
      token: null,
      password: 'new-password123',
      confirm: 'new-password123',
    }))
      .resolves.toEqual({ status: 'rejected', code: 'invalid_token' });
    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({
      action: 'auth.password_update.completed',
      flow: 'password_update',
      stage: 'token',
      outcome: 'rejected',
      reasonCode: 'invalid_token',
    });
    expect(JSON.stringify(records)).not.toContain('new-password123');
  });

  it('verifies an account with a valid email token', async () => {
    const verifiedAccounts: Array<{ userId: string; email: string; verifiedAt: Date }> = [];
    const service = createAuthenticationService(createDependencies({
      tokens: {
        consumeVerification: async () => ({
          status: 'valid',
          email: 'viewer@example.com',
          userId: 'user-1',
        }),
      },
      users: {
        verifyEmail: async (userId, email, verifiedAt) => {
          verifiedAccounts.push({ userId, email, verifiedAt });
          return true;
        },
      },
    }));

    await expect(service.verifyEmail({ token: 'verification-token' }))
      .resolves.toEqual({ status: 'success', code: 'email_verified' });
    expect(verifiedAccounts).toEqual([{
      userId: 'user-1',
      email: 'viewer@example.com',
      verifiedAt: new Date('2026-08-09T17:00:00.000Z'),
    }]);
  });

  it('applies a bound email change only to the intended user', async () => {
    const verifiedAccounts: Array<{ userId: string; email: string }> = [];
    const revokeAllSessions = jest.fn();
    const service = createAuthenticationService(createDependencies({
      tokens: {
        consumeVerification: async () => ({
          status: 'valid',
          email: 'old@example.com',
          targetEmail: 'new@example.com',
          userId: 'user-1',
        }),
      },
      users: {
        findByEmail: async () => null,
        verifyEmail: async (userId, email) => {
          verifiedAccounts.push({ userId, email });
          return true;
        },
      },
      security: { revokeAllSessions },
    }));

    await expect(service.verifyEmail({ token: 'email-change-token' }))
      .resolves.toEqual({ status: 'success', code: 'email_verified' });
    expect(verifiedAccounts).toEqual([{ userId: 'user-1', email: 'new@example.com' }]);
    expect(revokeAllSessions).toHaveBeenCalledWith('user-1', 'email_changed');
  });

  it('returns a controlled result when the verified target email became unavailable', async () => {
    const service = createAuthenticationService(createDependencies({
      tokens: {
        consumeVerification: async () => ({
          status: 'valid',
          email: 'old@example.com',
          targetEmail: 'taken@example.com',
          userId: 'user-1',
        }),
      },
      users: {
        verifyEmail: async () => false,
      },
    }));

    await expect(service.verifyEmail({ token: 'email-change-token' }))
      .resolves.toEqual({ status: 'rejected', code: 'email_in_use' });
  });

  it('rejects an expired verification token with a stable result code', async () => {
    const service = createAuthenticationService(createDependencies({
      tokens: {
        consumeVerification: async () => ({ status: 'expired' }),
      },
    }));

    await expect(service.verifyEmail({ token: 'verification-token' }))
      .resolves.toEqual({ status: 'rejected', code: 'token_expired' });
  });

  it('categorizes an unexpected email-verification database failure without leaking it', async () => {
    const records: AuthenticationTelemetryRecord[] = [];
    const databaseError = new Error('verification query exposed viewer@example.com');
    const service = createAuthenticationService(createDependencies({
      tokens: {
        consumeVerification: async () => ({
          status: 'valid',
          email: 'viewer@example.com',
          userId: 'user-1',
        }),
      },
      users: {
        findById: async () => {
          throw databaseError;
        },
      },
      telemetry: createTelemetry(records),
    }));

    await expect(service.verifyEmail({ token: 'verification-token' })).rejects.toBe(databaseError);
    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({
      action: 'auth.email_verification.completed',
      flow: 'email_verification',
      stage: 'account',
      outcome: 'failed',
      reasonCode: 'unexpected_failure',
      errorCategory: 'database',
    });
    const serialized = JSON.stringify(records);
    expect(serialized).not.toContain('viewer@example.com');
    expect(serialized).not.toContain('verification query exposed');
    expect(serialized).not.toContain('verification-token');
  });
});
