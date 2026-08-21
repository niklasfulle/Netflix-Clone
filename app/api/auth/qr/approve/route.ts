import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { qrDevicePairingService } from '@/lib/authentication/production-qr-device-pairing';
import { recentAuthenticationService } from '@/lib/authentication/production-recent-authentication';

function isTrustedOrigin(request: Request): boolean {
  const expectedOrigin = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  const origin = request.headers.get('origin');
  return Boolean(expectedOrigin && origin === expectedOrigin);
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  const sessionId = session?.user?.sessionId;
  if (!userId || !sessionId || session.user.isBlocked) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 401 });
  }

  let body: { approvalSecret?: unknown; password?: unknown; mfaCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }

  if (
    typeof body.approvalSecret !== 'string' || body.approvalSecret.length > 128
    || typeof body.password !== 'string' || body.password.length > 512
    || (body.mfaCode !== undefined && (typeof body.mfaCode !== 'string' || body.mfaCode.length > 128))
  ) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }

  const recentAuthentication = await recentAuthenticationService.verifyAndGrant({
    userId,
    sessionId,
    password: body.password,
    mfaCode: body.mfaCode,
  });
  if (recentAuthentication.status !== 'verified') {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  const result = await qrDevicePairingService().approve({
    approvalSecret: body.approvalSecret,
    userId,
    sessionId,
  });
  return NextResponse.json(result, { status: result.status === 'approved' ? 200 : 404 });
}
