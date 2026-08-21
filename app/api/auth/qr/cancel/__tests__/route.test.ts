/** @jest-environment node */

const cancel = jest.fn();

jest.mock('@/lib/authentication/production-qr-device-pairing', () => ({
  qrDevicePairingService: jest.fn(),
}));

import { POST } from '@/app/api/auth/qr/cancel/route';
import { qrDevicePairingService } from '@/lib/authentication/production-qr-device-pairing';

const mockQrDevicePairingService = jest.mocked(qrDevicePairingService);

describe('POST /api/auth/qr/cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancel.mockResolvedValue({ status: 'cancelled' });
    mockQrDevicePairingService.mockReturnValue({ cancel } as never);
  });

  it('cancels a pending pairing with the target-device polling secret', async () => {
    const pollSecret = 'p'.repeat(43);
    const response = await POST(new Request('https://netflix.local/api/auth/qr/cancel', {
      method: 'POST',
      body: JSON.stringify({ pollSecret }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'cancelled' });
    expect(cancel).toHaveBeenCalledWith(pollSecret);
  });
});
