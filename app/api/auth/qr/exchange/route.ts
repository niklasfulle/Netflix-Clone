import { NextResponse } from 'next/server';

import { signIn } from '@/auth';

function isTrustedOrigin(request: Request): boolean {
  const configuredOrigin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (!configuredOrigin) return false;
  try {
    return request.headers.get('origin') === new URL(configuredOrigin).origin;
  } catch {
    return false;
  }
}

function isExchangeSecret(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 32 && value.length <= 128;
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  let body: { exchangeSecret?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }
  if (!isExchangeSecret(body.exchangeSecret)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }

  try {
    const result = await signIn('qr-device', { exchangeSecret: body.exchangeSecret, redirect: false });
    if (typeof result === 'string' && result.includes('error=')) {
      return NextResponse.json({ error: 'Request rejected.' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 404 });
  }

  return NextResponse.json({ status: 'authenticated' }, { headers: { 'Cache-Control': 'no-store' } });
}
