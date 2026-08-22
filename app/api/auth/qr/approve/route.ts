import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { consumeAuthAttempt } from '@/lib/auth-throttle';
import { qrDevicePairingService } from '@/lib/authentication/production-qr-device-pairing';
import { recentAuthenticationService } from '@/lib/authentication/production-recent-authentication';
import { currentSecurityContext, sessionSecurity } from '@/lib/session-security';

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

  let body: { approvalSecret?: unknown; manualCode?: unknown; password?: unknown; mfaCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }

  const approvalSecret = typeof body.approvalSecret === 'string'
    && body.approvalSecret.length >= 32
    && body.approvalSecret.length <= 128
    ? body.approvalSecret
    : undefined;
  const manualCode = typeof body.manualCode === 'string'
    && /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/.test(body.manualCode)
    ? body.manualCode
    : undefined;
  if (
    Boolean(approvalSecret) === Boolean(manualCode)
    || typeof body.password !== 'string' || body.password.length > 512
    || (body.mfaCode !== undefined && (typeof body.mfaCode !== 'string' || body.mfaCode.length > 128))
  ) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }

  const pairingSecret = approvalSecret ?? manualCode;
  if (!pairingSecret) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 400 });
  }
  const limit = await consumeAuthAttempt('qr-approve', pairingSecret);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Request rejected.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
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

  const pairing = qrDevicePairingService();
  const result = approvalSecret
    ? await pairing.approve({ approvalSecret, userId, sessionId })
    : await pairing.approveByManualCode({ manualCode: manualCode!, userId, sessionId });
  if (result.status === 'approved') {
    await sessionSecurity.recordActivity(userId, 'qr_device_approved', await currentSecurityContext());
  }
  return NextResponse.json(result, { status: result.status === 'approved' ? 200 : 404 });
}
