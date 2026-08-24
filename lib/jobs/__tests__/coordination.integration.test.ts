/** @jest-environment node */

import { createRedisJobCoordination } from '@/lib/jobs/coordination';
import { createRedisRuntime } from '@/lib/redis/runtime';

const runIntegration = process.env.RUN_REDIS_RUNTIME_ADAPTER_INTEGRATION === '1';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('background job coordination with a real Redis server', () => {
  const url = process.env.REDIS_INTEGRATION_URL ?? '';

  it('round-trips a bounded, expiring job progress snapshot', async () => {
    expect(url).not.toBe('');
    const runtime = createRedisRuntime({
      environment: 'integration',
      url,
      connectTimeoutMs: 500,
      commandTimeoutMs: 200,
    });
    const coordination = createRedisJobCoordination(runtime, { ttlSeconds: 30 });
    const updatedAt = new Date('2026-08-23T10:01:10.000Z');

    await coordination.publish('integration-job-run-123', {
      status: 'RUNNING',
      progress: 25,
      progressMessage: 'Scanning catalog media',
      attemptCount: 1,
      updatedAt,
    });

    await expect(coordination.read('integration-job-run-123')).resolves.toEqual({
      version: 1,
      jobRunId: 'integration-job-run-123',
      status: 'RUNNING',
      progress: 25,
      progressMessage: 'Scanning catalog media',
      attemptCount: 1,
      updatedAt: updatedAt.toISOString(),
    });
    await runtime.close();
  });
});
