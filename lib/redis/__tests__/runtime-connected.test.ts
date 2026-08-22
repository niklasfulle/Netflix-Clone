/** @jest-environment node */

const mockRedisState = {
  open: false,
  ready: false,
  store: new Map<string, string>(),
  listeners: new Map<string, Array<(...arguments_: unknown[]) => void>>(),
  commandError: undefined as Error | undefined,
  evalArguments: undefined as { keys: string[]; arguments: string[] } | undefined,
};

jest.mock('redis', () => {
  const client = {
    get isOpen() {
      return mockRedisState.open;
    },
    get isReady() {
      return mockRedisState.ready;
    },
    on(event: string, listener: (...arguments_: unknown[]) => void) {
      const listeners = mockRedisState.listeners.get(event) ?? [];
      listeners.push(listener);
      mockRedisState.listeners.set(event, listeners);
      return client;
    },
    async connect() {
      mockRedisState.open = true;
      mockRedisState.ready = true;
      return client;
    },
    async get(key: string) {
      if (mockRedisState.commandError) throw mockRedisState.commandError;
      return mockRedisState.store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      if (mockRedisState.commandError) throw mockRedisState.commandError;
      mockRedisState.store.set(key, value);
      return 'OK';
    },
    async del(key: string) {
      if (mockRedisState.commandError) throw mockRedisState.commandError;
      return mockRedisState.store.delete(key) ? 1 : 0;
    },
    async eval(_script: string, options: { keys: string[]; arguments: string[] }) {
      if (mockRedisState.commandError) throw mockRedisState.commandError;
      mockRedisState.evalArguments = options;
      return [1, 60_000, 2, 59_500];
    },
    async ping() {
      if (mockRedisState.commandError) throw mockRedisState.commandError;
      return 'PONG';
    },
    async close() {
      mockRedisState.open = false;
      mockRedisState.ready = false;
    },
    destroy() {
      mockRedisState.open = false;
      mockRedisState.ready = false;
    },
  };

  return { createClient: () => client };
});

import { createRedisRuntime } from '@/lib/redis/runtime';

describe('configured RedisRuntime', () => {
  beforeEach(() => {
    mockRedisState.open = false;
    mockRedisState.ready = false;
    mockRedisState.store.clear();
    mockRedisState.listeners.clear();
    mockRedisState.commandError = undefined;
    mockRedisState.evalArguments = undefined;
  });

  it('increments multiple fixed-window counters in one atomic Redis command', async () => {
    const runtime = createRedisRuntime({
      environment: 'staging',
      url: 'redis://127.0.0.1:6379/0',
    });
    const accountKey = runtime.key('auth-rate-limit', 1, ['login', 'account', 'account-hash']);
    const ipKey = runtime.key('auth-rate-limit', 1, ['login', 'ip', 'ip-hash']);

    await expect(runtime.incrementFixedWindowCounters([
      { key: accountKey, limit: 5, windowMs: 60_000 },
      { key: ipKey, limit: 50, windowMs: 60_000 },
    ])).resolves.toMatchObject({
      status: 'ok',
      value: [
        { attempts: 1, retryAfterMs: 60_000 },
        { attempts: 2, retryAfterMs: 59_500 },
      ],
    });
    expect(mockRedisState.evalArguments).toEqual({
      keys: [accountKey, ipKey],
      arguments: ['5', '60000', '50', '60000'],
    });
  });

  it('stores, decodes, invalidates, and reports cache results through one interface', async () => {
    const runtime = createRedisRuntime({
      environment: 'staging',
      url: 'redis://127.0.0.1:6379/0',
    });
    const key = runtime.key('catalog-card', 1, ['movie-42']);

    await expect(runtime.set(key, { title: 'Example' }, { ttlSeconds: 60 })).resolves.toMatchObject({
      status: 'ok',
      value: true,
    });
    await expect(runtime.get(key, value => value as { title: string })).resolves.toMatchObject({
      status: 'ok',
      value: { title: 'Example' },
    });
    await expect(runtime.delete(key)).resolves.toMatchObject({ status: 'ok', value: true });
    await expect(runtime.get(key, value => value)).resolves.toMatchObject({
      status: 'ok',
      value: null,
    });
    await expect(runtime.health()).resolves.toMatchObject({
      metrics: {
        hits: 1,
        misses: 1,
      },
    });
  });

  it('opens a circuit after bounded timeouts and immediately degrades later calls', async () => {
    const telemetry: string[] = [];
    const timeout = Object.assign(new Error('Redis command timed out'), { code: 'ETIMEDOUT' });
    mockRedisState.commandError = timeout;
    const runtime = createRedisRuntime({
      environment: 'staging',
      url: 'redis://127.0.0.1:6379/0',
      commandTimeoutMs: 50,
      circuitCooldownMs: 25,
      telemetry: event => telemetry.push(event),
    });
    const key = runtime.key('catalog-card', 1, ['movie-42']);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(runtime.get(key, value => value)).resolves.toMatchObject({
        status: 'error',
        reason: 'timeout',
      });
    }
    await expect(runtime.get(key, value => value)).resolves.toEqual({
      status: 'skipped',
      reason: 'circuit-open',
    });
    await expect(runtime.health()).resolves.toMatchObject({
      status: 'degraded',
      connected: false,
      circuit: 'open',
      metrics: {
        commands: 3,
        errors: 3,
        timeouts: 3,
        fallbacks: 2,
      },
    });
    expect(telemetry).toEqual(['circuit-opened']);

    mockRedisState.commandError = undefined;
    await new Promise(resolve => setTimeout(resolve, 30));
    await expect(runtime.get(key, value => value)).resolves.toMatchObject({
      status: 'ok',
      value: null,
    });
    expect(telemetry).toEqual(['circuit-opened', 'reconnecting', 'circuit-closed']);
    await expect(runtime.health()).resolves.toMatchObject({
      status: 'ok',
      connected: true,
      circuit: 'closed',
      metrics: { reconnects: 1 },
    });
  });

  it('rejects unsafe values and remains reusable until graceful shutdown', async () => {
    const telemetry: string[] = [];
    const runtime = createRedisRuntime({
      environment: 'staging',
      url: 'redis://127.0.0.1:6379/0',
      telemetry: event => telemetry.push(event),
    });
    const key = runtime.key('catalog-card', 1, ['movie-42']);
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    await expect(runtime.set(key, cyclic, { ttlSeconds: 60 })).resolves.toMatchObject({
      status: 'error',
      reason: 'invalid-data',
    });
    await expect(runtime.set(key, 'x'.repeat(65 * 1024), { ttlSeconds: 60 })).resolves.toMatchObject({
      status: 'error',
      reason: 'invalid-data',
    });
    await expect(runtime.set(key, { title: 'Example' }, { ttlSeconds: 0 })).resolves.toMatchObject({
      status: 'error',
      reason: 'invalid-data',
    });
    await expect(runtime.set(key, { title: 'Example' }, { ttlSeconds: 60 })).resolves.toMatchObject({
      status: 'ok',
      value: true,
    });

    await runtime.close();
    await runtime.close();
    await expect(runtime.get(key, value => value)).resolves.toEqual({
      status: 'skipped',
      reason: 'closed',
    });
    await expect(runtime.health()).resolves.toMatchObject({
      status: 'closed',
      configured: true,
      connected: false,
    });
    expect(telemetry).toEqual(['closed']);
  });
});
