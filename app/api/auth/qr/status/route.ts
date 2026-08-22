import { NextResponse } from 'next/server';

import { consumeAuthAttempt } from '@/lib/auth-throttle';
import { qrDevicePairingService } from '@/lib/authentication/production-qr-device-pairing';

function isPollSecret(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 32 && value.length <= 128;
}

export async function POST(request: Request) {
  let body: { pollSecret?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }
  if (!isPollSecret(body.pollSecret)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }

  const limit = await consumeAuthAttempt('qr-poll', body.pollSecret);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Request rejected.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  return NextResponse.json(
    await qrDevicePairingService().status(body.pollSecret),
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
