/** @jest-environment node */

import { createRateLimiter } from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  it('blocks attempts after the configured limit and returns a safe retry delay', () => {
    let now = 1_000;
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000, now: () => now });

    expect(limiter.consume('account')).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.consume('account')).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.consume('account')).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 10,
    });

    now += 5_000;
    expect(limiter.consume('account')).toMatchObject({ allowed: false, retryAfterSeconds: 5 });
  });

  it('resets a key after its window expires and isolates identifiers', () => {
    let now = 1_000;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000, now: () => now });

    expect(limiter.consume('account-a').allowed).toBe(true);
    expect(limiter.consume('account-a').allowed).toBe(false);
    expect(limiter.consume('account-b').allowed).toBe(true);

    now = 2_001;
    expect(limiter.consume('account-a')).toMatchObject({ allowed: true, remaining: 0 });
  });

  it('bounds in-memory state by removing expired entries', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 10, now: () => now, maxKeys: 2 });
    limiter.consume('a');
    now = 20;
    limiter.consume('b');
    limiter.consume('c');

    expect(limiter.size()).toBeLessThanOrEqual(2);
  });

  it('refunds a successful attempt without clearing earlier failures', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000 });

    expect(limiter.consume('account').allowed).toBe(true);
    expect(limiter.consume('account').allowed).toBe(true);
    limiter.refund('account');

    expect(limiter.consume('account').allowed).toBe(true);
    expect(limiter.consume('account').allowed).toBe(false);
  });
});
