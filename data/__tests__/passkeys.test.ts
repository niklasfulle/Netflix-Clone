/** @jest-environment node */

const mockAuthenticator = {
  update: jest.fn(),
  findMany: jest.fn(),
  updateMany: jest.fn(),
};
const mockGrants = {
  deleteMany: jest.fn(),
  create: jest.fn(),
  count: jest.fn(),
  findMany: jest.fn(),
};
const mockTransaction = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    authenticator: {
      update: (...args: unknown[]) => mockAuthenticator.update(...args),
      findMany: (...args: unknown[]) => mockAuthenticator.findMany(...args),
      updateMany: (...args: unknown[]) => mockAuthenticator.updateMany(...args),
    },
    passkeyManagementGrant: {
      deleteMany: (...args: unknown[]) => mockGrants.deleteMany(...args),
      create: (...args: unknown[]) => mockGrants.create(...args),
      count: (...args: unknown[]) => mockGrants.count(...args),
      findMany: (...args: unknown[]) => mockGrants.findMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import {
  passkeyManagementRepository,
  passkeyMetadataRepository,
} from '@/data/passkeys';

describe('passkey persistence adapters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates authenticator counters and creates one grant per session', async () => {
    const now = new Date('2026-08-12T20:00:00.000Z');
    mockAuthenticator.update.mockResolvedValue({ credentialID: 'credential-1' });
    mockTransaction.mockResolvedValue([]);

    await expect(passkeyMetadataRepository.updateCounter('credential-1', 5, now))
      .resolves.toEqual({ credentialID: 'credential-1' });
    await passkeyManagementRepository.createGrant({
      tokenHash: 'hash',
      userId: 'user-1',
      sessionId: 'session-1',
      expiresAt: now,
    });

    expect(mockAuthenticator.update).toHaveBeenCalledWith({
      where: { credentialID: 'credential-1' },
      data: { counter: 5, lastUsedAt: now },
    });
    expect(mockTransaction).toHaveBeenCalledWith([
      undefined,
      undefined,
    ]);
  });

  it('checks grants with and without a current session binding', async () => {
    const now = new Date('2026-08-12T20:00:00.000Z');
    mockGrants.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    await expect(passkeyManagementRepository.hasActiveGrant(
      'hash', 'user-1', 'session-1', now,
    )).resolves.toBe(true);
    await expect(passkeyManagementRepository.hasActiveGrant(
      'hash', 'user-1', undefined, now,
    )).resolves.toBe(false);

    expect(mockGrants.count.mock.calls[0][0].where).toEqual(expect.objectContaining({
      tokenHash: 'hash',
      userId: 'user-1',
      sessionId: 'session-1',
    }));
    expect(mockGrants.count.mock.calls[1][0].where).not.toHaveProperty('sessionId');
  });

  it('cleans expired grants in bounded batches and skips empty batches', async () => {
    const now = new Date('2026-08-12T20:00:00.000Z');
    mockGrants.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ tokenHash: 'hash-1' }, { tokenHash: 'hash-2' }]);

    await passkeyManagementRepository.cleanupGrants(now);
    expect(mockGrants.deleteMany).not.toHaveBeenCalled();
    await passkeyManagementRepository.cleanupGrants(now);
    expect(mockGrants.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: { in: ['hash-1', 'hash-2'] } },
    });
  });

  it('maps authenticators to settings-safe passkey metadata and renames owned credentials', async () => {
    const createdAt = new Date('2026-08-12T19:00:00.000Z');
    mockAuthenticator.findMany.mockResolvedValue([{
      credentialID: 'credential-1',
      label: 'Laptop',
      credentialDeviceType: 'multiDevice',
      credentialBackedUp: true,
      transports: ['internal'],
      createdAt,
      lastUsedAt: null,
      secretColumn: 'not-returned',
    }]);
    mockAuthenticator.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(passkeyManagementRepository.list('user-1')).resolves.toEqual([{
      credentialId: 'credential-1',
      label: 'Laptop',
      deviceType: 'multiDevice',
      backedUp: true,
      transports: ['internal'],
      createdAt,
      lastUsedAt: null,
    }]);
    await expect(passkeyManagementRepository.rename('user-1', 'credential-1', 'Phone'))
      .resolves.toBe(true);
    await expect(passkeyManagementRepository.rename('user-1', 'missing', 'Phone'))
      .resolves.toBe(false);
  });

  it.each([
    ['missing credential', null, null, 0, 0, 'not_found'],
    ['missing user', { providerAccountId: 'account-1' }, null, 0, 0, 'not_found'],
    ['last sign-in method', { providerAccountId: 'account-1' }, { hashedPassword: null }, 0, 0, 'last_sign_in_method'],
  ])('protects removal for %s', async (_name, foundAuthenticator, user, alternatives, accounts, expected) => {
    const tx = {
      authenticator: {
        findFirst: jest.fn().mockResolvedValue(foundAuthenticator),
        count: jest.fn().mockResolvedValue(alternatives),
        delete: jest.fn(),
      },
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      account: { count: jest.fn().mockResolvedValue(accounts), deleteMany: jest.fn() },
    };
    mockTransaction.mockImplementation(async (callback) => callback(tx));

    await expect(passkeyManagementRepository.removeRecoverySafe('user-1', 'credential-1'))
      .resolves.toBe(expected);
    expect(tx.authenticator.delete).not.toHaveBeenCalled();
  });

  it.each([
    ['keeps a shared passkey account', 1, 0],
    ['removes an orphaned passkey account', 0, 1],
  ])('%s after deleting the credential', async (_name, remaining, accountDeletes) => {
    const tx = {
      authenticator: {
        findFirst: jest.fn().mockResolvedValue({ providerAccountId: 'account-1' }),
        count: jest.fn()
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(remaining),
        delete: jest.fn().mockResolvedValue(undefined),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ hashedPassword: null }) },
      account: {
        count: jest.fn().mockResolvedValue(0),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    mockTransaction.mockImplementation(async (callback) => callback(tx));

    await expect(passkeyManagementRepository.removeRecoverySafe('user-1', 'credential-1'))
      .resolves.toBe('removed');
    expect(tx.authenticator.delete).toHaveBeenCalledTimes(1);
    expect(tx.account.deleteMany).toHaveBeenCalledTimes(accountDeletes);
  });
});
