import { NextResponse } from 'next/server';

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

  const result = await qrDevicePairingService().cancel(body.pollSecret);
  return NextResponse.json(result, { status: result.status === 'cancelled' ? 200 : 404 });
}
