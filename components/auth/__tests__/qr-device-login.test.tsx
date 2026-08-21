import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QrDeviceLogin } from '@/components/auth/qr-device-login';

const replace = jest.fn();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));
jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe('QrDeviceLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        approvalUrl: 'https://netflix.local/auth/qr/approve?pair=approval-secret',
        exchangeSecret: 'e'.repeat(43),
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        manualCode: 'ABCD-EFGH-JKLM-NPQR',
        pollSecret: 'p'.repeat(43),
      }),
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
});
