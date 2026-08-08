import { createHash } from 'node:crypto';
import { headers } from 'next/headers';

import { createRateLimiter } from '@/lib/rate-limit';

export type AuthThrottleScope = 'login' | 'register' | 'password-reset' | 'verification-resend' | 'two-factor';

const SETTINGS: Record<AuthThrottleScope, { limit: number; windowMs: number }> = {
  login: { limit: 5, windowMs: 15 * 60_000 },
  register: { limit: 3, windowMs: 30 * 60_000 },
  'password-reset': { limit: 3, windowMs: 30 * 60_000 },
  'verification-resend': { limit: 3, windowMs: 30 * 60_000 },
  'two-factor': { limit: 5, windowMs: 10 * 60_000 },
};

const limiters = Object.fromEntries(
  Object.entries(SETTINGS).map(([scope, settings]) => [scope, createRateLimiter(settings)]),
) as Record<AuthThrottleScope, ReturnType<typeof createRateLimiter>>;

function hashIdentifier(value: string): string {
  return createHash('sha256').update(value.trim().toLocaleLowerCase('en')).digest('hex').slice(0, 16);
}

async function requestIp(): Promise<string> {
  try {
    const requestHeaders = await headers();
    return requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
      || requestHeaders.get('x-real-ip')?.trim()
      || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function throttleKeys(account: string) {
  const ip = await requestIp();
  return {
    account: `account:${hashIdentifier(account || 'unknown')}`,
    ip: `ip:${hashIdentifier(ip)}`,
  };
}

export async function consumeAuthAttempt(scope: AuthThrottleScope, account: string) {
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_AUTH_THROTTLE_IN_TESTS !== 'true') {
    return { allowed: true, retryAfterSeconds: 0, keyHash: 'test' };
  }
  const accountHash = hashIdentifier(account || 'unknown');
  const keys = await throttleKeys(account);
  const limiter = limiters[scope];
  const accountResult = limiter.consume(keys.account);
  const ipResult = limiter.consume(keys.ip);
  const allowed = accountResult.allowed && ipResult.allowed;

  return {
    allowed,
    retryAfterSeconds: Math.max(accountResult.retryAfterSeconds, ipResult.retryAfterSeconds),
    keyHash: accountHash,
  };
}

export async function releaseAuthAttempt(scope: AuthThrottleScope, account: string) {
  const keys = await throttleKeys(account);
  const limiter = limiters[scope];
  limiter.refund(keys.account);
  limiter.refund(keys.ip);
}
