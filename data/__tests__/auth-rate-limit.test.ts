/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: { $queryRaw: jest.fn(), $executeRaw: jest.fn() },
}));

import { db } from '@/lib/db';

import { authRateLimitRepository } from '../auth-rate-limit';

const mockedQueryRaw = db.$queryRaw as jest.Mock;
const mockedExecuteRaw = db.$executeRaw as jest.Mock;

describe('persistent authentication rate-limit repository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the atomic database bucket state', async () => {
    const resetAt = new Date('2026-08-09T20:10:00.000Z');
    mockedQueryRaw.mockResolvedValue([{ attempts: 3, resetAt }]);

    await expect(authRateLimitRepository.consume({
      scope: 'login',
      subjectType: 'account',
      subjectHash: 'account-hash',
      limit: 5,
      windowMs: 600_000,
      now: new Date('2026-08-09T20:00:00.000Z'),
    })).resolves.toEqual({ attempts: 3, resetAt });
    expect(mockedQueryRaw.mock.calls[0]?.[0].sql)
      .toContain("timezone('UTC', to_timestamp(");
    expect(mockedExecuteRaw).toHaveBeenCalledTimes(1);
  });

  it('fails closed when PostgreSQL returns no bucket', async () => {
    mockedQueryRaw.mockResolvedValue([]);

    await expect(authRateLimitRepository.consume({
      scope: 'login',
      subjectType: 'ip',
      subjectHash: 'ip-hash',
      limit: 5,
      windowMs: 600_000,
      now: new Date('2026-08-09T20:00:00.000Z'),
    })).rejects.toThrow('rate-limit bucket');
  });

  it('deletes only the requested subject bucket on reset', async () => {
    mockedExecuteRaw.mockResolvedValue(1);

    await expect(authRateLimitRepository.reset({
      scope: 'login',
      subjectType: 'account',
      subjectHash: 'account-hash',
    })).resolves.toBeUndefined();
    expect(mockedExecuteRaw).toHaveBeenCalledTimes(1);
  });
});
