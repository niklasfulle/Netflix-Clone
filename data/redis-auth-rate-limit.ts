import 'server-only';

import type { AuthRateLimitRepository } from '@/lib/authentication/throttle';
import type { RedisRuntime } from '@/lib/redis/runtime';

type AuthRateLimitRedisRuntime = Pick<
  RedisRuntime,
  'key' | 'incrementFixedWindowCounters' | 'delete'
>;

export function createRedisAuthRateLimitRepository({
  redis,
  fallback,
}: {
  redis: AuthRateLimitRedisRuntime;
  fallback: AuthRateLimitRepository;
}): AuthRateLimitRepository {
  const keyFor = (input: {
    scope: string;
    subjectType: string;
    subjectHash: string;
  }) => redis.key('auth-rate-limit', 1, [input.scope, input.subjectType, input.subjectHash]);

  return {
    async consume(inputs) {
      const redisDecision = await redis.incrementFixedWindowCounters(inputs.map(input => ({
        key: keyFor(input),
        limit: input.limit,
        windowMs: input.windowMs,
      })));
      if (redisDecision.status !== 'ok') {
        return fallback.consume(inputs);
      }
      if (redisDecision.value.length !== inputs.length) {
        return fallback.consume(inputs);
      }
      const redisBuckets = redisDecision.value.map((bucket, index) => ({
        attempts: bucket.attempts,
        resetAt: new Date(inputs[index].now.getTime() + bucket.retryAfterMs),
      }));
      const redisBudgetExhausted = redisBuckets.some((bucket, index) => (
        bucket.attempts > inputs[index].limit
      ));
      if (redisBudgetExhausted) return redisBuckets;
      return fallback.consume(inputs);
    },
    async reset(subjects) {
      await fallback.reset(subjects);
      await Promise.all(subjects.map(subject => redis.delete(keyFor(subject))));
    },
  };
}
