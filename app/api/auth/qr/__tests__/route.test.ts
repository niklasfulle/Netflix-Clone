/** @jest-environment node */

const create = jest.fn();

jest.mock('@/lib/auth-throttle', () => ({ consumeAuthAttempt: jest.fn() }));
jest.mock('@/lib/authentication/production-qr-device-pairing', () => ({
  qrDevicePairingService: jest.fn(),
}));

import { POST } from '@/app/api/auth/qr/route';
import { consumeAuthAttempt } from '@/lib/auth-throttle';
import { qrDevicePairingService } from '@/lib/authentication/production-qr-device-pairing';

const mockConsumeAuthAttempt = jest.mocked(consumeAuthAttempt);
const mockQrDevicePairingService = jest.mocked(qrDevicePairingService);

describe('POST /api/auth/qr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_URL = 'https://netflix.local';
    create.mockResolvedValue({
      expiresAt: new Date('2026-08-21T12:05:00.000Z'),
      manualCode: 'ABCD-EFGH-JKLM-NPQR',
      approvalUrl: 'https://netflix.local/auth/qr/approve?pair=approval',
      pollSecret: 'poll-secret-that-is-long-enough-to-be-valid',
    });
    mockConsumeAuthAttempt.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, keyHash: 'test' });
    mockQrDevicePairingService.mockReturnValue({ create } as never);
  });

  it('creates a no-store pairing only for the canonical origin', async () => {
    const response = await POST(new Request('https://netflix.local/api/auth/qr', {
      method: 'POST',
      headers: { origin: 'https://netflix.local', 'user-agent': 'test-device' },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      manualCode: 'ABCD-EFGH-JKLM-NPQR',
    }));
    expect(mockConsumeAuthAttempt).toHaveBeenCalledWith('qr-create', 'test-device');
  });

  it('rejects an untrusted origin before creating a pairing', async () => {
    const response = await POST(new Request('https://netflix.local/api/auth/qr', {
      method: 'POST',
      headers: { origin: 'https://attacker.invalid' },
    }));

    expect(response.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });
});
