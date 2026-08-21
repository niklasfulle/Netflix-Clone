/** @jest-environment node */

jest.mock('@/auth', () => ({ signIn: jest.fn() }));

import { signIn } from '@/auth';
import { POST } from '@/app/api/auth/qr/exchange/route';

const mockSignIn = jest.mocked(signIn);

describe('POST /api/auth/qr/exchange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_URL = 'https://netflix.local';
    mockSignIn.mockResolvedValue('/profiles' as never);
  });

  it('creates the target-device session only through the QR credentials provider', async () => {
    const exchangeSecret = 'e'.repeat(43);
    const response = await POST(new Request('https://netflix.local/api/auth/qr/exchange', {
      method: 'POST',
      headers: { origin: 'https://netflix.local' },
      body: JSON.stringify({ exchangeSecret }),
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ status: 'authenticated' });
    expect(mockSignIn).toHaveBeenCalledWith('qr-device', { exchangeSecret, redirect: false });
  });

  it('does not disclose a rejected or replayed exchange secret', async () => {
    mockSignIn.mockResolvedValue('/auth/login?error=CredentialsSignin' as never);
    const response = await POST(new Request('https://netflix.local/api/auth/qr/exchange', {
      method: 'POST',
      headers: { origin: 'https://netflix.local' },
      body: JSON.stringify({ exchangeSecret: 'e'.repeat(43) }),
    }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Request rejected.' });
  });
});
