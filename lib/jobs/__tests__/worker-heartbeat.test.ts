/** @jest-environment node */

import {
  createWorkerHeartbeat,
  type WorkerHeartbeatDatabase,
} from '@/lib/jobs/worker-heartbeat';

describe('worker heartbeat', () => {
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
