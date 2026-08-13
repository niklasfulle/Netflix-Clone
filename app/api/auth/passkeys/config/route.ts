import { NextResponse } from 'next/server';

import { passkeysEnabled } from '@/lib/passkey-provider';

export async function GET() {
  return NextResponse.json(
    { enabled: passkeysEnabled },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
