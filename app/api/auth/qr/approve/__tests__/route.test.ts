/** @jest-environment node */

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/auth-throttle', () => ({ consumeAuthAttempt: jest.fn() }));
jest.mock('@/lib/authentication/production-recent-authentication', () => ({
  recentAuthenticationService: { verifyAndGrant: jest.fn() },
}));
jest.mock('@/lib/authentication/production-qr-device-pairing', () => ({
  qrDevicePairingService: jest.fn(),
}));
jest.mock('@/lib/session-security', () => ({
  currentSecurityContext: jest.fn(),
  sessionSecurity: { recordActivity: jest.fn() },
}));

import { auth } from '@/auth';
import { POST } from '@/app/api/auth/qr/approve/route';
import { consumeAuthAttempt } from '@/lib/auth-throttle';
import { qrDevicePairingService } from '@/lib/authentication/production-qr-device-pairing';
import { recentAuthenticationService } from '@/lib/authentication/production-recent-authentication';
import { currentSecurityContext, sessionSecurity } from '@/lib/session-security';

const mockAuth = jest.mocked(auth);
const mockConsumeAuthAttempt = jest.mocked(consumeAuthAttempt);
const mockQrDevicePairingService = jest.mocked(qrDevicePairingService);
const mockVerifyAndGrant = jest.mocked(recentAuthenticationService.verifyAndGrant);
const mockCurrentSecurityContext = jest.mocked(currentSecurityContext);
const mockRecordActivity = jest.mocked(sessionSecurity.recordActivity);

describe('POST /api/auth/qr/approve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_URL = 'https://netflix.local';
    mockAuth.mockResolvedValue({ user: { id: 'user-1', sessionId: 'session-1', isBlocked: false } } as never);
    mockConsumeAuthAttempt.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, keyHash: 'test' });
    mockVerifyAndGrant.mockResolvedValue({ status: 'verified' });
    mockCurrentSecurityContext.mockResolvedValue(undefined);
  });

  it('requires fresh authentication before atomically approving by QR secret', async () => {
    const approve = jest.fn().mockResolvedValue({ status: 'approved' });
    mockQrDevicePairingService.mockReturnValue({ approve } as never);
    const approvalSecret = 'a'.repeat(43);
    const response = await POST(new Request('https://netflix.local/api/auth/qr/approve', {
      method: 'POST',
      headers: { origin: 'https://netflix.local' },
      body: JSON.stringify({ approvalSecret, password: 'correct-horse-battery-staple' }),
    }));

    expect(response.status).toBe(200);
    expect(mockVerifyAndGrant).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', sessionId: 'session-1' }));
    expect(approve).toHaveBeenCalledWith(expect.objectContaining({ approvalSecret, userId: 'user-1' }));
    expect(mockRecordActivity).toHaveBeenCalledWith('user-1', 'qr_device_approved', undefined);
  });

  it('accepts the grouped manual code as the accessible approval fallback', async () => {
    const approveByManualCode = jest.fn().mockResolvedValue({ status: 'approved' });
    mockQrDevicePairingService.mockReturnValue({ approveByManualCode } as never);
    const manualCode = 'ABCD-EFGH-JKLM-NPQR';
    const response = await POST(new Request('https://netflix.local/api/auth/qr/approve', {
      method: 'POST',
      headers: { origin: 'https://netflix.local' },
      body: JSON.stringify({ manualCode, password: 'correct-horse-battery-staple' }),
    }));

    expect(response.status).toBe(200);
    expect(approveByManualCode).toHaveBeenCalledWith(expect.objectContaining({ manualCode, userId: 'user-1' }));
  });
});
