import { NextResponse } from 'next/server';

import { consumeAuthAttempt } from '@/lib/auth-throttle';
import { qrDevicePairingService } from '@/lib/authentication/production-qr-device-pairing';

function isTrustedOrigin(request: Request): boolean {
  const configuredOrigin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (!configuredOrigin) return false;
  try {
    return request.headers.get('origin') === new URL(configuredOrigin).origin;
  } catch {
    return false;
  }
}

function rateLimitIdentity(request: Request): string {
  return request.headers.get('user-agent') ?? 'unknown-device';
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  const limit = await consumeAuthAttempt('qr-create', rateLimitIdentity(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Request rejected.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const pairing = await qrDevicePairingService().create();
  return NextResponse.json(pairing, { headers: { 'Cache-Control': 'no-store' } });
}
