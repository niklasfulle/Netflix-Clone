import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QrDeviceLogin } from '@/components/auth/qr-device-login';

const replace = jest.fn();
const refresh = jest.fn();
const translate = (key: string) => key;
const router = { replace, refresh };

jest.mock('next/navigation', () => ({
  useRouter: () => router,
}));
jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: translate }),
}));

describe('QrDeviceLogin', () => {
  const pairing = {
    approvalUrl: 'https://netflix.local/auth/qr/approve?pair=approval-secret',
    exchangeSecret: 'e'.repeat(43),
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    manualCode: 'ABCD-EFGH-JKLM-NPQR',
    pollSecret: 'p'.repeat(43),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => pairing,
    }) as jest.Mock;
  });

  it('creates an accessible QR and manual-code pairing only after user activation', async () => {
    render(<QrDeviceLogin />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in with QR code' }));

    expect(await screen.findByText('Manual code')).toBeInTheDocument();
    expect(screen.getByText('ABCD-EFGH-JKLM-NPQR')).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/auth/qr', {
      method: 'POST',
      cache: 'no-store',
    }));
  });

  it('starts only one exchange while an approved pairing is being consumed', async () => {
    let finishExchange: ((value: { ok: boolean }) => void) | undefined;
    const exchangeResponse = new Promise<{ ok: boolean }>((resolve) => {
      finishExchange = resolve;
    });
    global.fetch = jest.fn((input: string | URL | Request) => {
      const url = input.toString();
      if (url === '/api/auth/qr') {
        return Promise.resolve({ ok: true, json: async () => pairing }) as Promise<Response>;
      }
      if (url === '/api/auth/qr/status') {
        return Promise.resolve({ ok: true, json: async () => ({ status: 'approved' }) }) as Promise<Response>;
      }
      if (url === '/api/auth/qr/exchange') {
        return exchangeResponse as Promise<Response>;
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as jest.Mock;

    render(<QrDeviceLogin />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with QR code' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/auth/qr/exchange', expect.any(Object)));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2_100));
    });

    const exchangeCalls = (global.fetch as jest.Mock).mock.calls
      .filter(([url]) => url === '/api/auth/qr/exchange');
    expect(exchangeCalls).toHaveLength(1);

    await act(async () => {
      finishExchange?.({ ok: true });
    });
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });
});
