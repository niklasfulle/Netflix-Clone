import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AuthEmailSent } from '../auth-email-sent';

const labels = {
  title: 'Check your email',
  description: 'We sent you a link.',
  expiryHint: 'The link expires in one hour.',
  resendLabel: 'Send again',
  resendingLabel: 'Sending again…',
  resendAvailableLabel: 'Resend available in',
  resentLabel: 'Email sent again.',
  errorLabel: 'Unable to resend.',
};

describe('AuthEmailSent', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('replaces an active form with guidance and an accessible resend countdown', () => {
    render(
      <AuthEmailSent
        {...labels}
        email="viewer@example.com"
        initialCooldownSeconds={2}
        onResend={async () => ({ status: 'success', code: 'verification_sent' })}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Resend available in 2s' });
    expect(button).toBeDisabled();

    act(() => jest.advanceTimersByTime(2_000));
    expect(screen.getByRole('button', { name: 'Send again' })).toBeEnabled();
  });

  it('uses server retry metadata for the next countdown', async () => {
    render(
      <AuthEmailSent
        {...labels}
        email="viewer@example.com"
        initialCooldownSeconds={0}
        onResend={async () => ({
          status: 'retry',
          code: 'rate_limited',
          retryAfterSeconds: 42,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send again' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Resend available in 42s' })).toBeDisabled();
    });
  });
});
