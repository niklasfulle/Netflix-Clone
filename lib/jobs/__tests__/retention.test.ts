/** @jest-environment node */

import {
  createJobRunRetention,
  type JobRunRetentionDatabase,
} from '@/lib/jobs/retention';

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
