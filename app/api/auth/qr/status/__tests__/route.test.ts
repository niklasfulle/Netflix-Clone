/** @jest-environment node */

const status = jest.fn();

jest.mock('@/lib/auth-throttle', () => ({ consumeAuthAttempt: jest.fn() }));
jest.mock('@/lib/authentication/production-qr-device-pairing', () => ({
  qrDevicePairingService: jest.fn(),
}));

import { POST } from '@/app/api/auth/qr/status/route';
import { consumeAuthAttempt } from '@/lib/auth-throttle';
import { qrDevicePairingService } from '@/lib/authentication/production-qr-device-pairing';

const mockConsumeAuthAttempt = jest.mocked(consumeAuthAttempt);
const mockQrDevicePairingService = jest.mocked(qrDevicePairingService);

describe('POST /api/auth/qr/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    status.mockResolvedValue({ status: 'pending' });
    mockConsumeAuthAttempt.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, keyHash: 'test' });
    mockQrDevicePairingService.mockReturnValue({ status } as never);
  });

  it('polls with a bounded secret and returns only the public state', async () => {
    const pollSecret = 'p'.repeat(43);
    const response = await POST(new Request('https://netflix.local/api/auth/qr/status', {
      method: 'POST',
      body: JSON.stringify({ pollSecret }),
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ status: 'pending' });
    expect(mockConsumeAuthAttempt).toHaveBeenCalledWith('qr-poll', pollSecret);
  });

  it('rejects malformed polling input', async () => {
    const response = await POST(new Request('https://netflix.local/api/auth/qr/status', {
      method: 'POST',
      body: JSON.stringify({ pollSecret: 'short' }),
    }));

    expect(response.status).toBe(400);
    expect(status).not.toHaveBeenCalled();
  });
});
