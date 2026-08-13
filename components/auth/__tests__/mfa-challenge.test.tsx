import { fireEvent, render, screen } from '@testing-library/react';

import { MfaChallenge } from '@/components/auth/mfa-challenge';

jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe('MfaChallenge', () => {
  it('submits authenticator codes and exposes recovery and email fallback paths', () => {
    const onSubmit = jest.fn();
    const onRequestEmail = jest.fn();
    render(
      <MfaChallenge
        challenge={{
          status: 'challenge',
          code: 'two_factor_required',
          challenge: 'totp',
          canUseEmailFallback: true,
        }}
        isPending={false}
        onSubmit={onSubmit}
        onRequestEmail={onRequestEmail}
        onResendEmail={jest.fn()}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Two-step verification' })).toBeInTheDocument();
    const input = screen.getByLabelText('Authenticator code');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onSubmit).toHaveBeenCalledWith('123456', 'totp');

    fireEvent.click(screen.getByRole('button', { name: 'Use a recovery code' }));
    expect(screen.getByLabelText('Recovery code')).toHaveAttribute('inputmode', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Use email code instead' }));
    expect(onRequestEmail).toHaveBeenCalledTimes(1);
  });

  it('shows the masked email destination, expiry, and resend cooldown', () => {
    render(
      <MfaChallenge
        challenge={{
          status: 'challenge',
          code: 'two_factor_required',
          challenge: 'email_otp',
          maskedDestination: 'v***r@example.com',
          expiresInSeconds: 600,
          resendAfterSeconds: 60,
        }}
        isPending={false}
        onSubmit={jest.fn()}
        onRequestEmail={jest.fn()}
        onResendEmail={jest.fn()}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText('v***r@example.com')).toBeInTheDocument();
    expect(screen.getByText('Code expires in 10:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send again in 60s' })).toBeDisabled();
  });
});
