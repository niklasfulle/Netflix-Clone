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
  it.each([401, 'network'] as const)('keeps approval recoverable after %s failures', async failure => {
    global.fetch = failure === 'network' ? jest.fn().mockRejectedValue(new Error('Offline')) : jest.fn().mockResolvedValue({ ok: false, status: failure });
    render(<QrDeviceApproval />);
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'password' } });
    fireEvent.change(screen.getByLabelText('Optional MFA or recovery code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve sign-in' }));
    expect(await screen.findByText(failure === 401 ? 'Sign in on this phone first, then return to approve the other device.' : 'This sign-in request could not be approved. Check the code and your recent authentication.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/qr/approve', expect.objectContaining({ body: JSON.stringify({ approvalSecret: 'approval-secret', password: 'password', mfaCode: '123456' }) }));
    expect(mockReplace).not.toHaveBeenCalled();
  });
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
