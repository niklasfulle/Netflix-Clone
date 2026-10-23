/** @jest-environment node */

import {
  createJobRunRetention,
  type JobRunRetentionDatabase,
} from '@/lib/jobs/retention';

it('uses the current runtime clock when no explicit clock is supplied', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-23T10:00:00Z'));
  try {
    const database = { $executeRawUnsafe: jest.fn().mockResolvedValue(0) };
    await expect(createJobRunRetention({ database }).removeExpired()).resolves.toBe(0);
    expect(database.$executeRawUnsafe).toHaveBeenCalledWith(expect.any(String), new Date('2026-09-23T10:00:00Z'), 100);
  } finally { jest.useRealTimers(); }
});

it('removes at most one bounded batch of terminal job runs older than thirty days', async () => {
  const executeRaw = jest.fn().mockResolvedValue(17);
  const database = { $executeRawUnsafe: executeRaw } as JobRunRetentionDatabase;
  const retention = createJobRunRetention({
    database,
    now: () => new Date('2026-08-25T10:00:00.000Z'),
  });

  await expect(retention.removeExpired()).resolves.toBe(17);
  expect(executeRaw).toHaveBeenCalledWith(
    expect.stringContaining('LIMIT $2'),
    new Date('2026-07-26T10:00:00.000Z'),
    100,
  );
});
