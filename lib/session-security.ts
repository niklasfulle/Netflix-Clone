import { createHmac, randomUUID } from 'node:crypto';

import { headers } from 'next/headers';

import { sessionSecurityRepository } from '@/data/session-security';
import { createSessionSecurity } from '@/lib/authentication/session-security';
import { resolveClientAddress } from '@/lib/authentication/throttle';

function trustedProxyHops(): number {
  const configuredHops = Number.parseInt(process.env.AUTH_TRUSTED_PROXY_HOPS ?? '0', 10);
  return Number.isInteger(configuredHops) && configuredHops >= 0 && configuredHops <= 5
    ? configuredHops
    : 0;
}

function sessionSecuritySecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required for privacy-safe session security');
  }
  return secret ?? 'development-session-security-secret';
}

export function securityContextFromHeaders(requestHeaders: Headers) {
  return {
    address: resolveClientAddress(requestHeaders, trustedProxyHops()),
    userAgent: requestHeaders.get('user-agent') ?? undefined,
  };
}

export async function currentSecurityContext() {
  try {
    return securityContextFromHeaders(await headers());
  } catch {
    return undefined;
  }
}

export const sessionSecurity = createSessionSecurity({
  repository: sessionSecurityRepository,
  now: () => new Date(),
  createId: randomUUID,
  hashAddress: (address) => createHmac('sha256', sessionSecuritySecret())
    .update(address)
    .digest('hex'),
});
