/** @jest-environment node */

jest.mock('@/lib/db', () => ({ db: { $queryRawUnsafe: jest.fn(), $executeRawUnsafe: jest.fn() } }));

import { db } from '@/lib/db';
import { operationalLeases } from '../runtime';

describe('operational lease runtime', () => {
  beforeEach(() => jest.resetAllMocks());

  it('runs protected work through the configured PostgreSQL lease and releases ownership', async () => {
    jest.mocked(db.$queryRawUnsafe).mockResolvedValueOnce([{ fencingToken: BigInt(2), expiresAt: new Date(Date.now() + 30_000) }]).mockResolvedValueOnce([{ current: true }]);
    jest.mocked(db.$executeRawUnsafe).mockResolvedValueOnce(1);
    const work = jest.fn(async () => 'completed');
    await expect(operationalLeases.execute({ operation: 'backup.verify', targetId: 'backup:latest', ttlMs: 30_000 }, work)).resolves.toBe('completed');
    expect(work).toHaveBeenCalledWith(expect.objectContaining({ fencingToken: BigInt(2) }));
    expect(db.$executeRawUnsafe).toHaveBeenCalledTimes(1);
  });

  it('does not run protected work when another worker owns the lease', async () => {
    jest.mocked(db.$queryRawUnsafe).mockResolvedValueOnce([]);
    const work = jest.fn();
    await expect(operationalLeases.execute({ operation: 'backup.verify', targetId: 'backup:latest', ttlMs: 30_000 }, work)).rejects.toThrow('already running');
    expect(work).not.toHaveBeenCalled();
  });
});
