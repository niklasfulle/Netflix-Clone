const mockCurrentUser = jest.fn();
const mockGetUserById = jest.fn();
const mockCompare = jest.fn();
const mockGetAuthenticator = jest.fn();
const mockSavePending = jest.fn();
const mockActivate = jest.fn();
const mockConsumeChallenge = jest.fn();
const mockRemoveMfa = jest.fn();
const mockSendSecurityNotice = jest.fn();
const mockLogBackendAction = jest.fn();
const mockCurrentSecurityContext = jest.fn();
const mockRevokeOtherSessions = jest.fn();
const mockRecordActivity = jest.fn();

jest.mock('@/lib/auth', () => ({ currentUser: (...args: unknown[]) => mockCurrentUser(...args) }));
jest.mock('@/data/user', () => ({ getUserById: (...args: unknown[]) => mockGetUserById(...args) }));
jest.mock('bcryptjs', () => ({ compare: (...args: unknown[]) => mockCompare(...args) }));
jest.mock('@/data/mfa', () => ({
  getMfaAuthenticator: (...args: unknown[]) => mockGetAuthenticator(...args),
  savePendingMfaAuthenticator: (...args: unknown[]) => mockSavePending(...args),
  activateMfaAuthenticator: (...args: unknown[]) => mockActivate(...args),
  consumeMfaChallenge: (...args: unknown[]) => mockConsumeChallenge(...args),
  removeMfa: (...args: unknown[]) => mockRemoveMfa(...args),
}));
jest.mock('@/lib/authentication/mfa-crypto', () => ({
  generateTotpSecret: () => 'BASE32SECRET',
  encryptMfaSecret: () => 'encrypted-secret',
  decryptMfaSecret: () => 'BASE32SECRET',
  createTotpEnrollmentUri: () => 'otpauth://totp/setup',
  findMatchingTotpCounter: () => BigInt(42),
  generateRecoveryCodes: () => ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF'],
  hashRecoveryCode: (_userId: string, code: string) => `hash:${code}`,
}));
jest.mock('@/lib/mail', () => ({
  sendSecurityNotificationEmail: (...args: unknown[]) => mockSendSecurityNotice(...args),
}));
jest.mock('@/lib/logger', () => ({
  logBackendAction: (...args: unknown[]) => mockLogBackendAction(...args),
}));
jest.mock('@/lib/session-security', () => ({
  currentSecurityContext: (...args: unknown[]) => mockCurrentSecurityContext(...args),
  sessionSecurity: {
    revokeOtherSessions: (...args: unknown[]) => mockRevokeOtherSessions(...args),
    recordActivity: (...args: unknown[]) => mockRecordActivity(...args),
  },
}));

import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  disableMfa,
} from '@/actions/mfa';

describe('MFA account actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      isOAuth: false,
      sessionId: 'current-session',
    });
    mockGetUserById.mockResolvedValue({
      id: 'user-1',
      email: 'viewer@example.com',
      hashedPassword: 'stored-hash',
      isTwoFactorEnabled: false,
    });
    mockCompare.mockResolvedValue(true);
    mockGetAuthenticator.mockResolvedValue({
      userId: 'user-1',
      secretCiphertext: 'encrypted-secret',
      verifiedAt: null,
      updatedAt: new Date(),
    });
    mockActivate.mockResolvedValue(true);
    mockConsumeChallenge.mockResolvedValue('totp');
    mockSendSecurityNotice.mockResolvedValue(undefined);
    mockCurrentSecurityContext.mockResolvedValue({ userAgent: 'Browser/1.0' });
  });

  it('requires current-password reauthentication before starting TOTP enrollment', async () => {
    await expect(beginTotpEnrollment({ password: '' })).resolves.toEqual({
      status: 'rejected',
      code: 'reauthentication_required',
    });
    expect(mockSavePending).not.toHaveBeenCalled();
  });

  it('starts enrollment only after verifying the current password', async () => {
    await expect(beginTotpEnrollment({ password: 'password123' })).resolves.toEqual({
      status: 'success',
      code: 'mfa_enrollment_started',
      setup: {
        secret: 'BASE32SECRET',
        uri: 'otpauth://totp/setup',
      },
    });
    expect(mockCompare).toHaveBeenCalledWith('password123', 'stored-hash');
    expect(mockSavePending).toHaveBeenCalledWith('user-1', 'encrypted-secret');
  });

  it('activates TOTP and returns recovery codes exactly once after a valid setup code', async () => {
    await expect(confirmTotpEnrollment({ code: '123456' })).resolves.toEqual({
      status: 'success',
      code: 'mfa_enabled',
      recoveryCodes: ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF'],
    });
    expect(mockActivate).toHaveBeenCalledWith(
      'user-1',
      BigInt(42),
      ['hash:AAAA-BBBB-CCCC', 'hash:DDDD-EEEE-FFFF'],
      expect.any(Date),
    );
    expect(mockSendSecurityNotice).toHaveBeenCalledWith(
      'viewer@example.com',
      'Authenticator-based multi-factor authentication was enabled.',
    );
    expect(mockRevokeOtherSessions).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      currentSessionId: 'current-session',
    }));
    expect(mockRecordActivity).toHaveBeenCalledWith(
      'user-1',
      'mfa_enabled',
      { userAgent: 'Browser/1.0' },
    );
  });

  it('rejects enrollment confirmation after the recent-reauthentication window expires', async () => {
    mockGetAuthenticator.mockResolvedValue({
      userId: 'user-1',
      secretCiphertext: 'encrypted-secret',
      verifiedAt: null,
      updatedAt: new Date(Date.now() - 11 * 60_000),
    });

    await expect(confirmTotpEnrollment({ code: '123456' })).resolves.toEqual({
      status: 'rejected',
      code: 'mfa_setup_expired',
    });
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('requires the current password and a live MFA code before disabling MFA', async () => {
    mockGetUserById.mockResolvedValue({
      id: 'user-1',
      email: 'viewer@example.com',
      hashedPassword: 'stored-hash',
      isTwoFactorEnabled: true,
    });

    await expect(disableMfa({ password: 'password123', code: '123456' })).resolves.toEqual({
      status: 'success',
      code: 'mfa_disabled',
    });
    expect(mockConsumeChallenge).toHaveBeenCalledWith('user-1', '123456', expect.any(Date));
    expect(mockRemoveMfa).toHaveBeenCalledWith('user-1');
    expect(mockRevokeOtherSessions).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      currentSessionId: 'current-session',
    }));
    expect(mockRecordActivity).toHaveBeenCalledWith(
      'user-1',
      'mfa_disabled',
      { userAgent: 'Browser/1.0' },
    );
  });
});
