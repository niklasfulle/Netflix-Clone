/** @jest-environment node */

export {};

const mockCreatePairingService = jest.fn();
const mockCreateRecentAuthenticationService = jest.fn();
const mockCreateAuthenticationTelemetry = jest.fn();
const mockCreateAuthenticationService = jest.fn();
const mockCompare = jest.fn();
const mockHash = jest.fn();
const mockConsumeMfaChallenge = jest.fn();
const mockHasVerifiedAuthenticator = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockGetUserById = jest.fn();
const mockWrite = jest.fn();
const mockSignIn = jest.fn();
const mockConsumeAuthToken = jest.fn();
const mockGetConfirmation = jest.fn();
const mockConsumeAuthAttempt = jest.fn();
const mockReleaseAuthAttempt = jest.fn();
const mockLogBackendAction = jest.fn();
const mockSendVerificationEmail = jest.fn();
const mockSendResetPasswordEmail = jest.fn();
const mockSendTwoFactorEmail = jest.fn();
const mockGenerateVerificationToken = jest.fn();
const mockGeneratePasswordResetToken = jest.fn();
const mockGenerateTwoFactorToken = jest.fn();
const mockCurrentSecurityContext = jest.fn();
const mockRevokeAllSessions = jest.fn();
const mockPrivacySafeContext = jest.fn();
const mockDb = {
  user: { create: jest.fn(), update: jest.fn() },
  twoFactorConfirmation: { delete: jest.fn(), create: jest.fn() },
};

jest.mock('@/auth', () => ({ signIn: (...args: unknown[]) => mockSignIn(...args) }));
jest.mock('@/data/auth-token', () => ({ consumeAuthToken: (...args: unknown[]) => mockConsumeAuthToken(...args) }));
jest.mock('@/data/two-factor-confirmation', () => ({ getTwoFactorConfirmationByUserId: (...args: unknown[]) => mockGetConfirmation(...args) }));

jest.mock('@/data/qr-device-pairing', () => ({
  qrDevicePairingRepository: { kind: 'pairing-repository' },
  recentAuthenticationGrantRepository: { kind: 'grant-repository' },
}));
jest.mock('@/data/mfa', () => ({
  consumeMfaChallenge: (...args: unknown[]) => mockConsumeMfaChallenge(...args),
  hasVerifiedMfaAuthenticator: (...args: unknown[]) => mockHasVerifiedAuthenticator(...args),
}));
jest.mock('@/data/user', () => ({
  getUserByEmail: (...args: unknown[]) => mockGetUserByEmail(...args),
  getUserById: (...args: unknown[]) => mockGetUserById(...args),
}));
jest.mock('@/lib/log-store', () => ({ backendLogStore: { write: (...args: unknown[]) => mockWrite(...args) } }));
jest.mock('@/lib/auth-throttle', () => ({
  consumeAuthAttempt: (...args: unknown[]) => mockConsumeAuthAttempt(...args),
  releaseAuthAttempt: (...args: unknown[]) => mockReleaseAuthAttempt(...args),
}));
jest.mock('@/lib/db', () => ({ db: mockDb }));
jest.mock('@/lib/logger', () => ({ logBackendAction: (...args: unknown[]) => mockLogBackendAction(...args) }));
jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
  sendResetPasswordEmail: (...args: unknown[]) => mockSendResetPasswordEmail(...args),
  sendTwoFactorEmail: (...args: unknown[]) => mockSendTwoFactorEmail(...args),
}));
jest.mock('@/lib/tokens', () => ({
  generateVerificationToken: (...args: unknown[]) => mockGenerateVerificationToken(...args),
  generatePasswordResetToken: (...args: unknown[]) => mockGeneratePasswordResetToken(...args),
  generateTwoFactorToken: (...args: unknown[]) => mockGenerateTwoFactorToken(...args),
}));
jest.mock('@/lib/session-security', () => ({
  currentSecurityContext: (...args: unknown[]) => mockCurrentSecurityContext(...args),
  sessionSecurity: { revokeAllSessions: (...args: unknown[]) => mockRevokeAllSessions(...args) },
}));
jest.mock('@/lib/authentication/qr-device-pairing', () => ({ createQrDevicePairingService: (...args: unknown[]) => mockCreatePairingService(...args) }));
jest.mock('@/lib/authentication/recent-authentication', () => ({ createRecentAuthenticationService: (...args: unknown[]) => mockCreateRecentAuthenticationService(...args) }));
jest.mock('@/lib/authentication/telemetry', () => ({ createAuthenticationTelemetry: (...args: unknown[]) => mockCreateAuthenticationTelemetry(...args) }));
jest.mock('@/lib/authentication/service', () => ({ createAuthenticationService: (...args: unknown[]) => mockCreateAuthenticationService(...args) }));
jest.mock('@/lib/authentication/privacy', () => ({ privacySafeAuthenticationContext: (...args: unknown[]) => mockPrivacySafeContext(...args) }));
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    compare: (...args: unknown[]) => mockCompare(...args),
    hash: (...args: unknown[]) => mockHash(...args),
  },
}));

describe('production authentication adapters', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnvironment };
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('pins device pairing to the configured canonical authentication origin', async () => {
    process.env.AUTH_URL = 'https://netflix.example';
    mockCreatePairingService.mockReturnValue({ kind: 'pairing-service' });

    const { qrDevicePairingService } = await import('@/lib/authentication/production-qr-device-pairing');

    expect(qrDevicePairingService()).toEqual({ kind: 'pairing-service' });
    expect(mockCreatePairingService).toHaveBeenCalledWith(expect.objectContaining({
      pairingRequests: { kind: 'pairing-repository' },
      recentAuthentication: { kind: 'grant-repository' },
      canonicalOrigin: 'https://netflix.example',
      clock: { now: expect.any(Function) },
    }));
  });

  it('accepts NEXTAUTH_URL as the legacy canonical origin and otherwise fails closed', async () => {
    delete process.env.AUTH_URL;
    process.env.NEXTAUTH_URL = 'https://legacy-netflix.example';
    mockCreatePairingService.mockReturnValue({ kind: 'pairing-service' });
    let pairingAdapter = await import('@/lib/authentication/production-qr-device-pairing');

    expect(pairingAdapter.qrDevicePairingService()).toEqual({ kind: 'pairing-service' });
    expect(mockCreatePairingService).toHaveBeenLastCalledWith(expect.objectContaining({
      canonicalOrigin: 'https://legacy-netflix.example',
    }));

    jest.resetModules();
    delete process.env.NEXTAUTH_URL;
    pairingAdapter = await import('@/lib/authentication/production-qr-device-pairing');
    expect(() => pairingAdapter.qrDevicePairingService()).toThrow(
      'AUTH_URL is required for QR device pairing',
    );
  });

  it('wires recent authentication to the production account, MFA, and grant boundaries', async () => {
    mockCreateRecentAuthenticationService.mockReturnValue({ kind: 'recent-authentication-service' });
    mockGetUserById.mockResolvedValue({ id: 'user-123' });
    mockCompare.mockResolvedValue(true);
    mockConsumeMfaChallenge.mockResolvedValue(true);

    const { recentAuthenticationService } = await import('@/lib/authentication/production-recent-authentication');
    const dependencies = mockCreateRecentAuthenticationService.mock.calls[0][0];

    expect(recentAuthenticationService).toEqual({ kind: 'recent-authentication-service' });
    await expect(dependencies.users.findById('user-123')).resolves.toEqual({ id: 'user-123' });
    await expect(dependencies.passwords.verify('password', 'hash')).resolves.toBe(true);
    await expect(dependencies.mfa.consume('challenge')).resolves.toBe(true);
    expect(dependencies.grants).toEqual({ kind: 'grant-repository' });
    expect(dependencies.clock.now()).toBeInstanceOf(Date);
  });

  it('writes production authentication telemetry with environment and version context', async () => {
    process.env.DEPLOYMENT_ENVIRONMENT = 'staging';
    mockCreateAuthenticationTelemetry.mockReturnValue({ kind: 'authentication-telemetry' });

    const { authenticationTelemetry } = await import('@/lib/authentication/production-telemetry');
    const dependencies = mockCreateAuthenticationTelemetry.mock.calls[0][0];
    const record = { event: 'auth.login.started' };

    expect(authenticationTelemetry).toEqual({ kind: 'authentication-telemetry' });
    dependencies.write(record);
    expect(mockWrite).toHaveBeenCalledWith(record);
    expect(dependencies.environment).toBe('staging');
    expect(dependencies.version).toEqual(expect.any(String));
    expect(dependencies.now()).toBeInstanceOf(Date);
    expect(dependencies.randomUUID()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('connects the authentication service to durable production boundaries', async () => {
    const authenticationService = { kind: 'authentication-service' };
    mockCreateAuthenticationService.mockReturnValue(authenticationService);
    mockCreateAuthenticationTelemetry.mockReturnValue({ kind: 'authentication-telemetry' });
    mockHasVerifiedAuthenticator.mockResolvedValue(true);
    mockHash.mockResolvedValue('password-hash');
    mockCompare.mockResolvedValue(true);
    mockDb.user.create.mockResolvedValue({ id: 'user-123' });
    mockDb.user.update.mockResolvedValue({ id: 'user-123' });
    mockGetConfirmation.mockResolvedValue({ id: 'confirmation-123' });
    mockCurrentSecurityContext.mockResolvedValue({ ipHash: 'ip-hash' });
    mockPrivacySafeContext.mockReturnValue({ identityHash: 'identity-hash' });

    const runtime = await import('@/lib/authentication/production');
    const dependencies = mockCreateAuthenticationService.mock.calls[0][0];
    const account = {
      id: 'user-123',
      email: 'user@example.test',
      hashedPassword: 'password-hash',
    };

    expect(runtime.authenticationService).toBe(authenticationService);

    mockGetUserByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce(account);
    await expect(dependencies.users.findByEmail(account.email)).resolves.toBeNull();
    await expect(dependencies.users.findByEmail(account.email)).resolves.toEqual({
      ...account,
      hasVerifiedAuthenticator: true,
    });
    mockGetUserById.mockResolvedValueOnce(null).mockResolvedValueOnce(account);
    await expect(dependencies.users.findById(account.id)).resolves.toBeNull();
    await expect(dependencies.users.findById(account.id)).resolves.toEqual({
      ...account,
      hasVerifiedAuthenticator: true,
    });

    await expect(dependencies.users.create({ email: account.email })).resolves.toEqual({
      created: true,
      userId: account.id,
    });
    await dependencies.users.updatePassword(account.id, 'new-hash');
    await expect(dependencies.users.verifyEmail(account.id, account.email, new Date())).resolves.toBe(true);
    await expect(dependencies.passwords.hash('password')).resolves.toBe('password-hash');
    await expect(dependencies.passwords.verify('password', 'password-hash')).resolves.toBe(true);

    const now = new Date('2026-08-23T10:00:00.000Z');
    await dependencies.tokens.consumeTwoFactor(account.email, 'otp', now);
    await dependencies.tokens.consumePasswordReset('reset-token', now);
    await dependencies.tokens.consumeVerification('verification-token', now);
    expect(mockConsumeAuthToken).toHaveBeenNthCalledWith(1, 'two-factor', 'otp', now, account.email);
    expect(mockConsumeAuthToken).toHaveBeenNthCalledWith(2, 'password-reset', 'reset-token', now);
    expect(mockConsumeAuthToken).toHaveBeenNthCalledWith(3, 'verification', 'verification-token', now);

    await dependencies.mail.sendVerification({ email: account.email, token: 'verification-token' });
    await dependencies.mail.sendPasswordReset({ email: account.email, token: 'reset-token' });
    await dependencies.mail.sendTwoFactor({ email: account.email, token: 'otp' });
    await dependencies.session.signInCredentials({ email: account.email, password: 'password' });
    expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
      email: account.email,
      password: 'password',
    }));

    await dependencies.confirmations.replaceForUser(account.id);
    expect(mockDb.twoFactorConfirmation.delete).toHaveBeenCalledWith({
      where: { id: 'confirmation-123' },
    });
    expect(mockDb.twoFactorConfirmation.create).toHaveBeenCalledWith({ data: { userId: account.id } });

    await dependencies.security.revokeAllSessions(account.id, 'password-reset');
    expect(mockRevokeAllSessions).toHaveBeenCalledWith({
      userId: account.id,
      event: 'password-reset',
      context: { ipHash: 'ip-hash' },
    });
    dependencies.audit.log('auth.login.failed', { email: account.email }, 'warn');
    expect(mockLogBackendAction).toHaveBeenCalledWith(
      'auth.login.failed',
      { identityHash: 'identity-hash' },
      'warn',
    );
    expect(dependencies.clock.now()).toBeInstanceOf(Date);
  });
});
