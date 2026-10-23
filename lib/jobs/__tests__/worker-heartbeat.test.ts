/** @jest-environment node */

import {
  createWorkerHeartbeat,
  type WorkerHeartbeatDatabase,
} from '@/lib/jobs/worker-heartbeat';

describe('worker heartbeat', () => {
  it('marks a draining worker failed using the current clock and owned worker generation', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-23T12:00:00Z'));
    try {
      const database = { jobWorkerHeartbeat: { upsert: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
      const heartbeat = createWorkerHeartbeat({ database, instanceToken: 'worker-current' });
      await expect(heartbeat.markDraining()).resolves.toBe(true);
      await expect(heartbeat.markFailed()).resolves.toBe(true);
      expect(database.jobWorkerHeartbeat.updateMany).toHaveBeenLastCalledWith({ where: { id: 'primary', instanceToken: 'worker-current' }, data: { state: 'FAILED', heartbeatAt: new Date('2026-10-23T12:00:00Z'), stoppedAt: new Date('2026-10-23T12:00:00Z') } });
    } finally { jest.useRealTimers(); }
  });
  it('claims the singleton heartbeat and only updates its own worker generation', async () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const database = {
      jobWorkerHeartbeat: { upsert, updateMany },
    } as unknown as WorkerHeartbeatDatabase;
    const heartbeat = createWorkerHeartbeat({
      database,
      instanceToken: 'worker-generation-123',
      now: () => new Date('2026-08-25T10:00:00.000Z'),
    });

    await heartbeat.markStarting();
    await heartbeat.markActive();
    await heartbeat.beat();
    await heartbeat.markStopped();

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'primary' },
      create: expect.objectContaining({
        id: 'primary',
        instanceToken: 'worker-generation-123',
        state: 'STARTING',
      }),
    }));
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'primary', instanceToken: 'worker-generation-123' },
      data: expect.objectContaining({ state: 'STOPPED' }),
    }));
  });

  it('does not let a superseded worker overwrite the current heartbeat', async () => {
    const database = {
      jobWorkerHeartbeat: {
        upsert: jest.fn().mockResolvedValue(undefined),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as WorkerHeartbeatDatabase;
    const heartbeat = createWorkerHeartbeat({
      database,
      instanceToken: 'superseded-worker',
    });

    await expect(heartbeat.beat()).resolves.toBe(false);
  });
});
