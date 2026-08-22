/** @jest-environment node */

import {
  createRedisRuntime,
  createRedisRuntimeFromEnvironment,
} from '@/lib/redis/runtime';

describe('RedisRuntime', () => {
  it('is explicitly disabled without configuration and never blocks callers', async () => {
    const runtime = createRedisRuntime({ environment: 'development' });
    const key = runtime.key('catalog-card', 1, ['movie-42']);

    await expect(runtime.get(key, value => value)).resolves.toEqual({
      status: 'skipped',
      reason: 'disabled',
    });
    await expect(runtime.set(key, { title: 'Example' }, { ttlSeconds: 60 })).resolves.toEqual({
      status: 'skipped',
      reason: 'disabled',
    });
    await expect(runtime.delete(key)).resolves.toEqual({
      status: 'skipped',
      reason: 'disabled',
    });
    await expect(runtime.health()).resolves.toMatchObject({
      status: 'disabled',
      configured: false,
      connected: false,
      circuit: 'closed',
      metrics: {
        commands: 0,
        hits: 0,
        misses: 0,
        errors: 0,
        timeouts: 0,
        reconnects: 0,
        fallbacks: 3,
      },
    });
    await expect(runtime.close()).resolves.toBeUndefined();
  });

  it('builds deterministic environment-scoped keys without exposing identities', () => {
    const staging = createRedisRuntime({ environment: 'staging' });
    const production = createRedisRuntime({ environment: 'production' });
    const identities = ['viewer@example.test', 'reusable-session-token'];

    const first = staging.key('catalog-card', 2, identities);
    const repeated = staging.key('catalog-card', 2, identities);
    const otherEnvironment = production.key('catalog-card', 2, identities);

    expect(first).toMatch(/^netflix:staging:v2:catalog-card:[A-Za-z0-9_-]{22}$/);
    expect(first).toBe(repeated);
    expect(first).not.toBe(otherEnvironment);
    expect(first).not.toContain('viewer');
    expect(first).not.toContain('token');
    expect(() => staging.key('catalog-card', 2, ['x'.repeat(257)])).toThrow(
      'Redis key identities must be between 1 and 256 characters',
    );
  });

  it('validates environment configuration without contacting Redis', async () => {
    const disabled = createRedisRuntimeFromEnvironment({
      DEPLOYMENT_ENVIRONMENT: 'staging',
      REDIS_ENABLED: 'false',
    });

    await expect(disabled.health()).resolves.toMatchObject({
      status: 'disabled',
      configured: false,
    });

    expect(() => createRedisRuntimeFromEnvironment({
      DEPLOYMENT_ENVIRONMENT: 'staging',
      REDIS_ENABLED: 'true',
    })).toThrow('REDIS_URL is required when Redis is enabled');
    expect(() => createRedisRuntimeFromEnvironment({
      DEPLOYMENT_ENVIRONMENT: 'staging',
      REDIS_ENABLED: 'true',
      REDIS_URL: 'redis://app:password@redis-runtime:6379/0',
      REDIS_KEY_PREFIX: 'netflix:production:',
    })).toThrow('REDIS_KEY_PREFIX must match DEPLOYMENT_ENVIRONMENT');
    expect(() => createRedisRuntimeFromEnvironment({
      DEPLOYMENT_ENVIRONMENT: 'staging',
      REDIS_ENABLED: 'sometimes',
    })).toThrow('REDIS_ENABLED must be true or false');
  });
});
