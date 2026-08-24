/** @jest-environment node */

import { createWorkerLifecycle } from '@/lib/jobs/worker-lifecycle';

it('drains once and reaches a stopped state when the worker process is interrupted', async () => {
  const queue = {
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
  };
  const registerWork = jest.fn().mockResolvedValue(undefined);
  const disconnect = jest.fn().mockResolvedValue(undefined);
  const lifecycle = createWorkerLifecycle({ queue, registerWork, disconnect });

  await lifecycle.start();
  expect(lifecycle.state()).toBe('ACTIVE');

  await Promise.all([lifecycle.stop(), lifecycle.stop()]);

  expect(lifecycle.state()).toBe('STOPPED');
  expect(queue.stop).toHaveBeenCalledWith({ graceful: true, timeout: 90_000 });
  expect(queue.stop).toHaveBeenCalledTimes(1);
  expect(disconnect).toHaveBeenCalledTimes(1);
});

it('does not report a stopped worker when graceful drain fails', async () => {
  const lifecycle = createWorkerLifecycle({
    queue: {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockRejectedValue(new Error('drain timeout')),
    },
    registerWork: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  });
  await lifecycle.start();

  await expect(lifecycle.stop()).rejects.toThrow('drain timeout');
  expect(lifecycle.state()).toBe('FAILED');
});
