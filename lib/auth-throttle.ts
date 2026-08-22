import { headers } from 'next/headers';

import { authRateLimitRepository } from '@/data/auth-rate-limit';
import {
  createAuthenticationThrottle,
  resolveClientAddress,
  type AuthThrottleScope,
} from '@/lib/authentication/throttle';

export type { AuthThrottleScope } from '@/lib/authentication/throttle';

const SETTINGS: Record<AuthThrottleScope, { limit: number; ipLimit: number; windowMs: number }> = {
  login: { limit: 5, ipLimit: 50, windowMs: 15 * 60_000 },
  register: { limit: 3, ipLimit: 30, windowMs: 30 * 60_000 },
  'password-reset': { limit: 3, ipLimit: 30, windowMs: 30 * 60_000 },
  'verification-resend': { limit: 3, ipLimit: 30, windowMs: 30 * 60_000 },
  'two-factor': { limit: 5, ipLimit: 50, windowMs: 10 * 60_000 },
  'two-factor-send': { limit: 1, ipLimit: 20, windowMs: 60_000 },
  'qr-create': { limit: 10, ipLimit: 30, windowMs: 15 * 60_000 },
  'qr-approve': { limit: 5, ipLimit: 20, windowMs: 10 * 60_000 },
  'qr-poll': { limit: 120, ipLimit: 300, windowMs: 5 * 60_000 },
};

function trustedProxyHops(): number {
  const configuredHops = Number.parseInt(process.env.AUTH_TRUSTED_PROXY_HOPS ?? '0', 10);
  return Number.isInteger(configuredHops) && configuredHops >= 0 && configuredHops <= 5
    ? configuredHops
    : 0;
}

async function requestIp(): Promise<string> {
  try {
    const requestHeaders = await headers();
    return resolveClientAddress(requestHeaders, trustedProxyHops());
  } catch {
    return 'unknown';
  }
}

function hashSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required for persistent authentication throttling');
  }
  return secret ?? 'development-auth-throttle-secret';
}

let persistentThrottle: ReturnType<typeof createAuthenticationThrottle> | undefined;

function getPersistentThrottle() {
  persistentThrottle ??= createAuthenticationThrottle({
    repository: authRateLimitRepository,
    clientAddress: requestIp,
    secret: hashSecret(),
    settings: SETTINGS,
  });
  return persistentThrottle;
}

export async function consumeAuthAttempt(scope: AuthThrottleScope, account: string) {
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_AUTH_THROTTLE_IN_TESTS !== 'true') {
    return { allowed: true, retryAfterSeconds: 0, keyHash: 'test' };
  }
  return getPersistentThrottle().consume(scope, account);
}

export async function releaseAuthAttempt(scope: AuthThrottleScope, account: string) {
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_AUTH_THROTTLE_IN_TESTS !== 'true') {
    return;
  }
  await getPersistentThrottle().release(scope, account);
}
