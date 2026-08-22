import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { QrDeviceApproval } from '@/components/auth/qr-device-approval';
import { useSearchParams } from 'next/navigation';

jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

const mockUseSearchParams = jest.mocked(useSearchParams);
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: () => ({ replace: mockReplace }),
}));

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
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/settings'));
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
    expect(mockReplace).toHaveBeenCalledWith('/settings');
  });

  it('stays on the approval page when the request is rejected', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 }) as jest.Mock;
    render(<QrDeviceApproval />);

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve sign-in' }));

    expect(await screen.findByText(
      'This sign-in request could not be approved. Check the code and your recent authentication.',
    )).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
