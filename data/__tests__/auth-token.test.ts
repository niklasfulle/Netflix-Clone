jest.mock('@/lib/db', () => ({
  db: { $transaction: jest.fn() },
}));

import { db } from '@/lib/db';
import { hashOneTimeToken } from '@/lib/authentication/token-crypto';

import { consumeAuthToken } from '../auth-token';

const mockedTransaction = db.$transaction as jest.Mock;

function useTokenRecord(record: {
  id: string;
  email: string;
  expires: Date;
  userId: string | null;
  targetEmail?: string | null;
} | null) {
  let available = record !== null;
  const repository = {
    findUnique: jest.fn(async () => available ? record : null),
    deleteMany: jest.fn(async () => {
      if (!available) return { count: 0 };
      available = false;
      return { count: 1 };
    }),
  };
  mockedTransaction.mockImplementation(async (operation) => operation({
    verificationToken: repository,
    passwordResetToken: repository,
    twoFactorToken: repository,
  }));
  return repository;
}

describe('atomic authentication token consumption', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the account and target binding only once', async () => {
    useTokenRecord({
      id: 'token-1',
      email: 'old@example.com',
      targetEmail: 'new@example.com',
      userId: 'user-1',
      expires: new Date('2026-08-09T18:00:00.000Z'),
    });

    await expect(consumeAuthToken(
      'verification',
      'raw-token',
      new Date('2026-08-09T17:00:00.000Z'),
    )).resolves.toEqual({
      status: 'valid',
      email: 'old@example.com',
      targetEmail: 'new@example.com',
      userId: 'user-1',
    });
    await expect(consumeAuthToken(
      'verification',
      'raw-token',
      new Date('2026-08-09T17:00:00.000Z'),
    )).resolves.toEqual({ status: 'invalid' });
  });

  it('allows only one winner during concurrent consumption', async () => {
    useTokenRecord({
      id: 'token-1',
      email: 'viewer@example.com',
      userId: 'user-1',
      expires: new Date('2026-08-09T18:00:00.000Z'),
    });

    const results = await Promise.all([
      consumeAuthToken('password-reset', 'raw-token', new Date('2026-08-09T17:00:00.000Z')),
      consumeAuthToken('password-reset', 'raw-token', new Date('2026-08-09T17:00:00.000Z')),
    ]);

    expect(results.filter((result) => result.status === 'valid')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'invalid')).toHaveLength(1);
  });

  it('deletes expired tokens and rejects a mismatched two-factor identity', async () => {
    useTokenRecord({
      id: 'token-1',
      email: 'viewer@example.com',
      userId: 'user-1',
      expires: new Date('2026-08-09T16:59:59.000Z'),
    });
    await expect(consumeAuthToken(
      'two-factor',
      '123456',
      new Date('2026-08-09T17:00:00.000Z'),
      'other@example.com',
    )).resolves.toEqual({ status: 'invalid' });

    useTokenRecord({
      id: 'token-2',
      email: 'viewer@example.com',
      userId: 'user-1',
      expires: new Date('2026-08-09T16:59:59.000Z'),
    });
    await expect(consumeAuthToken(
      'two-factor',
      '123456',
      new Date('2026-08-09T17:00:00.000Z'),
      'viewer@example.com',
    )).resolves.toEqual({ status: 'expired' });
  });

  it('does not accept a token issued for another purpose', async () => {
    const passwordResetRepository = {
      findUnique: jest.fn(async () => null),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    };
    mockedTransaction.mockImplementation(async (operation) => operation({
      verificationToken: passwordResetRepository,
      passwordResetToken: passwordResetRepository,
      twoFactorToken: passwordResetRepository,
    }));

    await expect(consumeAuthToken(
      'password-reset',
      'sample-token',
      new Date('2026-08-09T17:00:00.000Z'),
    )).resolves.toEqual({ status: 'invalid' });
    expect(passwordResetRepository.findUnique).toHaveBeenCalledWith({
      where: {
        tokenHash: hashOneTimeToken('password-reset', 'sample-token'),
      },
    });
  });
});
