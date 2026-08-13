import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { MfaSettingsPanel } from '../mfa-settings-panel';

const mockBegin = jest.fn();
const mockConfirm = jest.fn();
const mockDisable = jest.fn();

jest.mock('@/actions/mfa', () => ({
  beginTotpEnrollment: (...args: unknown[]) => mockBegin(...args),
  confirmTotpEnrollment: (...args: unknown[]) => mockConfirm(...args),
  disableMfa: (...args: unknown[]) => mockDisable(...args),
}));
jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe('MfaSettingsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBegin.mockResolvedValue({
      status: 'success',
      code: 'mfa_enrollment_started',
      setup: { secret: 'BASE32SECRET', uri: 'otpauth://totp/setup' },
    });
    mockConfirm.mockResolvedValue({
      status: 'success',
      code: 'mfa_enabled',
      recoveryCodes: ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF'],
    });
    mockDisable.mockResolvedValue({ status: 'success', code: 'mfa_disabled' });
  });

  it('requires the current password before showing authenticator setup', async () => {
    render(<MfaSettingsPanel initiallyEnabled={false} onSessionRefresh={jest.fn()} />);

    fireEvent.change(screen.getByLabelText('Current password for MFA'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set up authenticator' }));

    await waitFor(() => expect(mockBegin).toHaveBeenCalledWith({ password: 'password123' }));
    expect(screen.getByText('BASE32SECRET')).toBeInTheDocument();
    expect(screen.getByLabelText('Authenticator setup code')).toBeInTheDocument();
  });

  it('shows recovery codes once after verified enrollment', async () => {
    render(<MfaSettingsPanel initiallyEnabled={false} onSessionRefresh={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Current password for MFA'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set up authenticator' }));
    await screen.findByText('BASE32SECRET');

    fireEvent.change(screen.getByLabelText('Authenticator setup code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and enable' }));

    expect(await screen.findByText('AAAA-BBBB-CCCC')).toBeInTheDocument();
    expect(screen.getByText('DDDD-EEEE-FFFF')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'I saved my recovery codes' }));
    expect(screen.queryByText('AAAA-BBBB-CCCC')).not.toBeInTheDocument();
  });

  it('requires password and a live MFA code before disabling protection', async () => {
    render(<MfaSettingsPanel initiallyEnabled onSessionRefresh={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Current password for MFA'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('MFA or recovery code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Disable MFA' }));

    await waitFor(() => expect(mockDisable).toHaveBeenCalledWith({
      password: 'password123',
      code: '123456',
    }));
  });
});
