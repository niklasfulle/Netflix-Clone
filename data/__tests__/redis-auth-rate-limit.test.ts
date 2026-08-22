/** @jest-environment node */

import type { AuthRateLimitRepository } from '@/lib/authentication/throttle';
import type { RedisKey, RedisRuntime } from '@/lib/redis/runtime';

import { createRedisAuthRateLimitRepository } from '../redis-auth-rate-limit';

const now = new Date('2026-08-23T10:00:00.000Z');
const inputs = [
  {
    scope: 'login',
    subjectType: 'account',
    subjectHash: 'account-hash',
    limit: 5,
    windowMs: 60_000,
    now,
  },
  {
    scope: 'login',
    subjectType: 'ip',
    subjectHash: 'ip-hash',
    limit: 50,
    windowMs: 60_000,
    now,
  },
] as const;

function createRuntime(
  counterResult: Awaited<ReturnType<RedisRuntime['incrementFixedWindowCounters']>>,
) {
  return {
    key: jest.fn((_namespace, _version, identities) => (
      `redis-test:${identities.join(':')}` as RedisKey
    )),
    incrementFixedWindowCounters: jest.fn().mockResolvedValue(counterResult),
    delete: jest.fn().mockResolvedValue({ status: 'ok', value: true, latencyMs: 1 }),
  };
}

function createFallback(buckets = [
  { attempts: 2, resetAt: new Date(now.getTime() + 60_000) },
  { attempts: 3, resetAt: new Date(now.getTime() + 60_000) },
]) {
  return {
    consume: jest.fn().mockResolvedValue(buckets),
    reset: jest.fn().mockResolvedValue(undefined),
  } satisfies AuthRateLimitRepository;
}

describe('Redis authentication rate-limit repository', () => {
  it('uses the PostgreSQL decision when Redis is unavailable', async () => {
    const redis = createRuntime({ status: 'error', reason: 'unavailable', latencyMs: 3 });
    const fallback = createFallback();
    const repository = createRedisAuthRateLimitRepository({ redis, fallback });

    await expect(repository.consume(inputs)).resolves.toEqual([
      { attempts: 2, resetAt: new Date(now.getTime() + 60_000) },
      { attempts: 3, resetAt: new Date(now.getTime() + 60_000) },
    ]);
    expect(fallback.consume).toHaveBeenCalledWith(inputs);
  });

  it('rejects an exhausted Redis budget without adding PostgreSQL load', async () => {
    const redis = createRuntime({
      status: 'ok',
      value: [
        { attempts: 6, retryAfterMs: 42_000 },
        { attempts: 7, retryAfterMs: 41_000 },
      ],
      latencyMs: 1,
    });
    const fallback = createFallback();
    const repository = createRedisAuthRateLimitRepository({ redis, fallback });

    await expect(repository.consume(inputs)).resolves.toEqual([
      { attempts: 6, resetAt: new Date(now.getTime() + 42_000) },
      { attempts: 7, resetAt: new Date(now.getTime() + 41_000) },
    ]);
    expect(fallback.consume).not.toHaveBeenCalled();
  });

  it('keeps PostgreSQL authoritative while Redis is below its limit', async () => {
    const redis = createRuntime({
      status: 'ok',
      value: [
        { attempts: 1, retryAfterMs: 60_000 },
        { attempts: 1, retryAfterMs: 60_000 },
      ],
      latencyMs: 1,
    });
    const postgresDecision = [
      { attempts: 6, resetAt: new Date(now.getTime() + 45_000) },
      { attempts: 9, resetAt: new Date(now.getTime() + 45_000) },
    ];
    const fallback = createFallback(postgresDecision);
    const repository = createRedisAuthRateLimitRepository({ redis, fallback });

    await expect(repository.consume(inputs)).resolves.toEqual(postgresDecision);
    expect(fallback.consume).toHaveBeenCalledWith(inputs);
  });

  it('fails closed when PostgreSQL cannot confirm an allowed Redis attempt', async () => {
    const redis = createRuntime({
      status: 'ok',
      value: [
        { attempts: 1, retryAfterMs: 60_000 },
        { attempts: 1, retryAfterMs: 60_000 },
      ],
      latencyMs: 1,
    });
    const fallback = createFallback();
    fallback.consume.mockRejectedValue(new Error('PostgreSQL unavailable'));
    const repository = createRedisAuthRateLimitRepository({ redis, fallback });

    await expect(repository.consume(inputs)).rejects.toThrow('PostgreSQL unavailable');
  });

  it('resets PostgreSQL authoritatively and clears the Redis account budget', async () => {
    const redis = createRuntime({ status: 'skipped', reason: 'disabled' });
    const fallback = createFallback();
    const repository = createRedisAuthRateLimitRepository({ redis, fallback });
    const accountSubject = inputs[0];

    await expect(repository.reset([accountSubject])).resolves.toBeUndefined();
    expect(fallback.reset).toHaveBeenCalledWith([accountSubject]);
    expect(redis.delete).toHaveBeenCalledTimes(1);
    expect(redis.key).toHaveBeenCalledWith('auth-rate-limit', 1, [
      'login',
      'account',
      'account-hash',
    ]);
  });
});
