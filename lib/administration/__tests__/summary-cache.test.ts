/** @jest-environment node */

import {
  cacheTelemetryHeaders,
  createRequestDeduplicator,
  createSummaryCache,
  type SummaryCacheDefinition,
} from '@/lib/administration/summary-cache';
import type {
  RedisFixedWindowCounter,
  RedisFixedWindowCounterValue,
  RedisHealth,
  RedisKey,
  RedisResult,
  RedisRuntime,
} from '@/lib/redis/runtime';

type StoredValue = { encoded: string; expiresAt: number };

class FakeRedisRuntime implements RedisRuntime {
  readonly values = new Map<string, StoredValue>();
  readonly deleted: string[] = [];
  available = true;

  constructor(
    private readonly environment: string,
    private readonly now: () => number,
  ) {}

  key(namespace: string, version: number, identities: readonly string[]): RedisKey {
    return `netflix:${this.environment}:v${version}:${namespace}:${identities.join(':')}` as RedisKey;
  }

  async get<T>(key: RedisKey, decode: (value: unknown) => T): Promise<RedisResult<T | null>> {
    if (!this.available) return { status: 'skipped', reason: 'disabled' };
    const stored = this.values.get(key);
    if (!stored || stored.expiresAt <= this.now()) {
      this.values.delete(key);
      return { status: 'ok', value: null, latencyMs: 0 };
    }
    try {
      return { status: 'ok', value: decode(JSON.parse(stored.encoded)), latencyMs: 0 };
    } catch {
      return { status: 'error', reason: 'invalid-data', latencyMs: 0 };
    }
  }

  async set<T>(key: RedisKey, value: T, options: { ttlSeconds: number }): Promise<RedisResult<true>> {
    if (!this.available) return { status: 'skipped', reason: 'disabled' };
    this.values.set(key, {
      encoded: JSON.stringify(value),
      expiresAt: this.now() + options.ttlSeconds * 1_000,
    });
    return { status: 'ok', value: true, latencyMs: 0 };
  }

  async incrementFixedWindowCounters(
    _counters: readonly RedisFixedWindowCounter[],
  ): Promise<RedisResult<readonly RedisFixedWindowCounterValue[]>> {
    return { status: 'skipped', reason: 'disabled' };
  }

  async delete(key: RedisKey): Promise<RedisResult<boolean>> {
    if (!this.available) return { status: 'skipped', reason: 'disabled' };
    this.deleted.push(key);
    return { status: 'ok', value: this.values.delete(key), latencyMs: 0 };
  }

  async health(): Promise<RedisHealth> {
    return {
      status: this.available ? 'ok' : 'disabled',
      configured: this.available,
      connected: this.available,
      circuit: 'closed',
      metrics: {
        commands: 0,
        hits: 0,
        misses: 0,
        errors: 0,
        timeouts: 0,
        reconnects: 0,
        fallbacks: 0,
        totalLatencyMs: 0,
      },
    };
  }

  async close(): Promise<void> {}
}

function definition(load: () => Promise<{ count: number }>): SummaryCacheDefinition<{ count: number }> {
  return {
    namespace: 'admin-overview',
    version: 1,
    identities: ['global'],
    ttlSeconds: 2,
    maxValueBytes: 1_024,
    decode(value) {
      if (
        !value
        || typeof value !== 'object'
        || !('count' in value)
        || typeof value.count !== 'number'
      ) {
        throw new Error('invalid summary');
      }
      return { count: value.count };
    },
    load,
  };
}

describe('administrator summary cache', () => {
  let currentTime: number;
  let redis: FakeRedisRuntime;

  beforeEach(() => {
    currentTime = 1_000;
    redis = new FakeRedisRuntime('staging', () => currentTime);
  });

  it('serves misses, hits, and expired values from the correct source', async () => {
    const cache = createSummaryCache({ redis, now: () => currentTime });
    let loads = 0;
    const value = definition(async () => ({ count: ++loads }));

    await expect(cache.read(value)).resolves.toMatchObject({
      value: { count: 1 }, source: 'miss', stored: true,
    });
    await expect(cache.read(value)).resolves.toMatchObject({
      value: { count: 1 }, source: 'hit', stored: true,
    });
    currentTime += 2_001;
    await expect(cache.read(value)).resolves.toMatchObject({
      value: { count: 2 }, source: 'miss', stored: true,
    });
    expect(loads).toBe(2);
  });

  it('falls back to the loader when Redis is unavailable', async () => {
    redis.available = false;
    const cache = createSummaryCache({ redis, now: () => currentTime });

    await expect(cache.read(definition(async () => ({ count: 7 }))))
      .resolves.toMatchObject({ value: { count: 7 }, source: 'fallback', stored: false });
  });

  it('deduplicates concurrent misses to prevent a query stampede', async () => {
    const cache = createSummaryCache({ redis, now: () => currentTime });
    let resolveLoad: ((value: { count: number }) => void) | undefined;
    const loader = jest.fn(() => new Promise<{ count: number }>(resolve => {
      resolveLoad = resolve;
    }));

    const first = cache.read(definition(loader));
    const second = cache.read(definition(loader));
    await Promise.resolve();
    resolveLoad?.({ count: 9 });

    const results = await Promise.all([first, second]);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(results.map(result => result.source).sort()).toEqual(['deduplicated', 'miss']);
  });

  it('evicts corrupt values and rebuilds them from PostgreSQL', async () => {
    const cache = createSummaryCache({ redis, now: () => currentTime });
    const value = definition(async () => ({ count: 11 }));
    const key = redis.key(value.namespace, value.version, value.identities);
    redis.values.set(key, { encoded: '{"count":"corrupt"}', expiresAt: currentTime + 10_000 });

    await expect(cache.read(value)).resolves.toMatchObject({
      value: { count: 11 }, source: 'stale', stored: true,
    });
    expect(redis.deleted).toContain(key);
  });

  it('prevents an in-flight stale load from repopulating an invalidated key', async () => {
    const cache = createSummaryCache({ redis, now: () => currentTime });
    let resolveLoad: ((value: { count: number }) => void) | undefined;
    const value = definition(() => new Promise(resolve => {
      resolveLoad = resolve;
    }));
    const pending = cache.read(value);
    await Promise.resolve();

    await cache.invalidate([value]);
    resolveLoad?.({ count: 13 });
    await expect(pending).resolves.toMatchObject({ stored: false });
    expect(redis.values.size).toBe(0);
  });

  it('bypasses an old value after invalidation failed during a Redis outage', async () => {
    const cache = createSummaryCache({ redis, now: () => currentTime });
    let databaseValue = 17;
    const value = definition(async () => ({ count: databaseValue }));
    await cache.read(value);

    redis.available = false;
    await cache.invalidate([value]);
    databaseValue = 18;
    redis.available = true;

    await expect(cache.read(value)).resolves.toMatchObject({
      value: { count: 18 },
      source: 'fallback',
      stored: true,
    });
    await expect(cache.read(value)).resolves.toMatchObject({
      value: { count: 18 },
      source: 'hit',
    });
  });

  it('does not store summaries above the explicit size limit', async () => {
    const cache = createSummaryCache({ redis, now: () => currentTime });
    const value = {
      ...definition(async () => ({ count: 1 })),
      maxValueBytes: 4,
    };

    await expect(cache.read(value)).resolves.toMatchObject({ stored: false });
    expect(redis.values.size).toBe(0);
  });

  it('isolates otherwise identical cache identities by environment', () => {
    const production = new FakeRedisRuntime('production', () => currentTime);
    const stagingKey = redis.key('admin-overview', 1, ['global']);
    const productionKey = production.key('admin-overview', 1, ['global']);

    expect(stagingKey).not.toBe(productionKey);
    expect(stagingKey).toContain('netflix:staging:');
    expect(productionKey).toContain('netflix:production:');
  });

  it('deduplicates non-cacheable live system reads only while they are active', async () => {
    const deduplicator = createRequestDeduplicator();
    const load = jest.fn().mockResolvedValue({ status: 'healthy' });

    const [first, second] = await Promise.all([
      deduplicator.run('system', load),
      deduplicator.run('system', load),
    ]);
    const third = await deduplicator.run('system', load);

    expect(load).toHaveBeenCalledTimes(2);
    expect([first.deduplicated, second.deduplicated].sort()).toEqual([false, true]);
    expect(third.deduplicated).toBe(false);
  });

  it('exposes bounded cache and query timing telemetry in response headers', () => {
    expect(cacheTelemetryHeaders({ source: 'hit', cacheReadMs: 3, loadMs: 0 }))
      .toEqual({
        'Cache-Control': 'private, no-store',
        'X-Admin-Cache': 'hit',
        'Server-Timing': 'redis;dur=3, postgres;dur=0',
      });
  });
});
