/** @jest-environment node */

const mockQueryRaw = jest.fn();
const mockExecuteRaw = jest.fn();
const mockTransaction = jest.fn();
const mockTransactionExecuteRaw = jest.fn();
const mockUserUpdate = jest.fn();
const mockDecryptMfaSecret = jest.fn();
const mockFindMatchingTotpCounter = jest.fn();
const mockHashRecoveryCode = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

jest.mock('@/lib/authentication/mfa-crypto', () => ({
  decryptMfaSecret: (...args: unknown[]) => mockDecryptMfaSecret(...args),
  findMatchingTotpCounter: (...args: unknown[]) => mockFindMatchingTotpCounter(...args),
  hashRecoveryCode: (...args: unknown[]) => mockHashRecoveryCode(...args),
}));

import {
  activateMfaAuthenticator,
  consumeMfaChallenge,
  getMfaAuthenticator,
  hasVerifiedMfaAuthenticator,
  removeMfa,
  savePendingMfaAuthenticator,
} from '@/data/mfa';

describe('MFA challenge persistence', () => {
  const now = new Date('2026-08-09T21:30:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async (callback) => callback({
      $executeRaw: (...args: unknown[]) => mockTransactionExecuteRaw(...args),
      user: { update: (...args: unknown[]) => mockUserUpdate(...args) },
    }));
  });

  it('reads authenticator and verification state defensively', async () => {
    const authenticator = {
      id: 'authenticator-1',
      userId: 'user-1',
      secretCiphertext: 'ciphertext',
      verifiedAt: now,
      lastUsedCounter: BigInt(1),
      updatedAt: now,
    };
    mockQueryRaw
      .mockResolvedValueOnce([authenticator])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ present: true }])
      .mockResolvedValueOnce([]);

    await expect(getMfaAuthenticator('user-1')).resolves.toEqual(authenticator);
    await expect(getMfaAuthenticator('missing')).resolves.toBeNull();
    await expect(hasVerifiedMfaAuthenticator('user-1')).resolves.toBe(true);
    await expect(hasVerifiedMfaAuthenticator('missing')).resolves.toBe(false);
  });

  it('replaces pending authenticators and stale recovery codes transactionally', async () => {
    mockTransactionExecuteRaw.mockResolvedValue(1);

    await savePendingMfaAuthenticator('user-1', 'encrypted-secret');

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransactionExecuteRaw).toHaveBeenCalledTimes(2);
  });

  it('activates an authenticator and stores each generated recovery code', async () => {
    mockTransactionExecuteRaw.mockResolvedValue(1);

    await expect(activateMfaAuthenticator(
      'user-1',
      BigInt(100),
      ['hash-1', 'hash-2'],
      now,
    )).resolves.toBe(true);

    expect(mockTransactionExecuteRaw).toHaveBeenCalledTimes(4);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isTwoFactorEnabled: true },
    });
  });

  it('does not create recovery codes when activation loses the race', async () => {
    mockTransactionExecuteRaw.mockResolvedValue(0);

    await expect(activateMfaAuthenticator(
      'user-1',
      BigInt(100),
      ['hash-1'],
      now,
    )).resolves.toBe(false);

    expect(mockTransactionExecuteRaw).toHaveBeenCalledTimes(1);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('claims a TOTP counter atomically so the same time window cannot be replayed', async () => {
    mockQueryRaw.mockResolvedValue([{
      id: 'authenticator-1',
      userId: 'user-1',
      secretCiphertext: 'encrypted-secret',
      verifiedAt: new Date('2026-08-09T21:00:00.000Z'),
      lastUsedCounter: null,
      updatedAt: now,
    }]);
    mockDecryptMfaSecret.mockReturnValue('BASE32SECRET');
    mockFindMatchingTotpCounter.mockReturnValue(BigInt(100));
    mockExecuteRaw.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(consumeMfaChallenge('user-1', '123456', now)).resolves.toBe('totp');
    await expect(consumeMfaChallenge('user-1', '123456', now)).resolves.toBeNull();

    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);
  });

  it('marks a recovery code used atomically so it succeeds only once', async () => {
    mockHashRecoveryCode.mockReturnValue('user-bound-code-hash');
    mockExecuteRaw.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(consumeMfaChallenge('user-1', 'AAAA-BBBB-CCCC', now)).resolves.toBe('recovery');
    await expect(consumeMfaChallenge('user-1', 'AAAA-BBBB-CCCC', now)).resolves.toBeNull();

    expect(mockHashRecoveryCode).toHaveBeenCalledTimes(2);
    expect(mockExecuteRaw).toHaveBeenCalledTimes(2);
  });

  it('rejects missing, unverified, and invalid authenticator codes', async () => {
    mockQueryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        id: 'authenticator-1',
        userId: 'user-1',
        secretCiphertext: 'encrypted-secret',
        verifiedAt: now,
        lastUsedCounter: null,
        updatedAt: now,
      }]);
    mockDecryptMfaSecret.mockReturnValue('BASE32SECRET');
    mockFindMatchingTotpCounter.mockReturnValue(null);

    await expect(consumeMfaChallenge('user-1', '123456', now)).resolves.toBeNull();
    await expect(consumeMfaChallenge('user-1', '123456', now)).resolves.toBeNull();
    expect(mockExecuteRaw).not.toHaveBeenCalled();
  });

  it('removes MFA material and disables the account flag transactionally', async () => {
    mockTransactionExecuteRaw.mockResolvedValue(1);

    await removeMfa('user-1');

    expect(mockTransactionExecuteRaw).toHaveBeenCalledTimes(2);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isTwoFactorEnabled: false },
    });
  });
});
