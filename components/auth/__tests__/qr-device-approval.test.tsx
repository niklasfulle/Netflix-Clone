import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QrDeviceApproval } from '@/components/auth/qr-device-approval';
import { useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({ useSearchParams: jest.fn() }));
jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

const mockUseSearchParams = jest.mocked(useSearchParams);

describe('QrDeviceApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams('pair=approval-secret') as never);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as jest.Mock;
  });

  it('uses the QR approval secret while requiring a fresh password confirmation', async () => {
    render(<QrDeviceApproval />);

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve sign-in' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/auth/qr/approve', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ approvalSecret: 'approval-secret', password: 'password' }),
    })));
    expect(await screen.findByText('The sign-in request was approved. You can return to the other device.')).toBeInTheDocument();
  });

  it('allows the accessible manual-code fallback', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as never);
    render(<QrDeviceApproval />);

    fireEvent.change(screen.getByPlaceholderText('ABCD-EFGH-JKLM-NPQR'), { target: { value: 'abcd-efgh-jklm-npqr' } });
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve sign-in' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/auth/qr/approve', expect.objectContaining({
      body: JSON.stringify({ manualCode: 'ABCD-EFGH-JKLM-NPQR', password: 'password' }),
    })));
  });
});
