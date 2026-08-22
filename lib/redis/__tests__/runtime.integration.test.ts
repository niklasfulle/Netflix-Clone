/** @jest-environment node */

import { execFileSync } from 'node:child_process';

import { createRedisRuntime } from '@/lib/redis/runtime';

const runIntegration = process.env.RUN_REDIS_RUNTIME_ADAPTER_INTEGRATION === '1';
const describeIntegration = runIntegration ? describe : describe.skip;

function docker(...arguments_: string[]): string {
  return execFileSync('docker', arguments_, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function waitForRedis(containerName: string): void {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      if (docker('exec', containerName, 'redis-cli', 'ping') === 'PONG') return;
    } catch {
      // Container startup is expected to take a few attempts.
    }
  }
  throw new Error('Redis integration container did not become ready');
}

describeIntegration('RedisRuntime with a real Redis server', () => {
  jest.setTimeout(30_000);

  const containerName = process.env.REDIS_INTEGRATION_CONTAINER ?? '';
  const url = process.env.REDIS_INTEGRATION_URL ?? '';

  afterEach(() => {
    try {
      docker('unpause', containerName);
    } catch {
      // It is valid for the container not to be paused.
    }
    try {
      docker('start', containerName);
      waitForRedis(containerName);
    } catch {
      // The runner performs final cleanup even if recovery fails.
    }
  });

  it('handles healthy, slow, unavailable, reconnecting, and shutdown states', async () => {
    expect(containerName).not.toBe('');
    expect(url).not.toBe('');

    const telemetry: string[] = [];
    const runtime = createRedisRuntime({
      environment: 'integration',
      url,
      connectTimeoutMs: 500,
      commandTimeoutMs: 100,
      circuitCooldownMs: 50,
      telemetry: event => telemetry.push(event),
    });
    const key = runtime.key('runtime-check', 1, ['public-test-identity']);
    async function recover() {
      let result = await runtime.get(key, value => value);
      for (let attempt = 1; attempt < 10 && result.status !== 'ok'; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 75));
        result = await runtime.get(key, value => value);
      }
      return result;
    }

    await expect(runtime.set(key, { ready: true }, { ttlSeconds: 30 })).resolves.toMatchObject({
      status: 'ok',
      value: true,
    });
    await expect(runtime.get(key, value => value)).resolves.toMatchObject({
      status: 'ok',
      value: { ready: true },
    });

    docker('pause', containerName);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(runtime.get(key, value => value)).resolves.toMatchObject({
        status: 'error',
      });
    }
    await expect(runtime.get(key, value => value)).resolves.toEqual({
      status: 'skipped',
      reason: 'circuit-open',
    });
    docker('unpause', containerName);
    await new Promise(resolve => setTimeout(resolve, 75));
    await expect(recover()).resolves.toMatchObject({
      status: 'ok',
      value: { ready: true },
    });

    docker('stop', '--time', '0', containerName);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(runtime.get(key, value => value)).resolves.toMatchObject({
        status: 'error',
        reason: expect.stringMatching(/^(timeout|unavailable)$/),
      });
    }
    await expect(runtime.health()).resolves.toMatchObject({
      status: 'degraded',
      connected: false,
      circuit: 'open',
    });

    docker('start', containerName);
    waitForRedis(containerName);
    expect(docker('port', containerName, '6379/tcp')).toBe(
      `127.0.0.1:${new URL(url).port}`,
    );
    const freshProbe = createRedisRuntime({
      environment: 'integration',
      url,
      connectTimeoutMs: 500,
      commandTimeoutMs: 100,
      circuitCooldownMs: 50,
    });
    await expect(freshProbe.health()).resolves.toMatchObject({ status: 'ok' });
    await freshProbe.close();
    await new Promise(resolve => setTimeout(resolve, 75));
    const restartedResult = await recover();
    expect(restartedResult).toEqual({
      status: 'ok',
      value: null,
      latencyMs: expect.any(Number),
    });
    const recoveredHealth = await runtime.health();
    expect(recoveredHealth).toMatchObject({
      status: 'ok',
      connected: true,
      circuit: 'closed',
    });
    expect(recoveredHealth.metrics.errors).toBeGreaterThanOrEqual(6);
    expect(recoveredHealth.metrics.reconnects).toBeGreaterThanOrEqual(2);
    expect(telemetry).toEqual(expect.arrayContaining([
      'circuit-opened',
      'reconnecting',
      'circuit-closed',
    ]));

    await runtime.close();
    await expect(runtime.get(key, value => value)).resolves.toEqual({
      status: 'skipped',
      reason: 'closed',
    });
  });
});
