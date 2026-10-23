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
  it('starts with a one-minute cooldown when no duration is supplied', () => {
    render(<AuthEmailSent {...labels} email="viewer@example.test" onResend={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Resend available in 60s' })).toBeDisabled();
  });

  it('prevents duplicate resends while pending and starts the default cooldown after success', async () => {
    let finish!: (result: { status: 'success'; code: 'verification_sent' }) => void;
    const onResend = jest.fn(() => new Promise<{ status: 'success'; code: 'verification_sent' }>(resolve => { finish = resolve; }));
    render(<AuthEmailSent {...labels} email="viewer@example.test" initialCooldownSeconds={0} onResend={onResend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send again' }));
    expect(screen.getByRole('button', { name: 'Sending again…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Sending again…' }));
    expect(onResend).toHaveBeenCalledTimes(1);
    await act(async () => { finish({ status: 'success', code: 'verification_sent' }); });
    expect(screen.getByText('Email sent again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend available in 60s' })).toBeDisabled();
  });

  it.each(['rejected', 'network'])('shows a recoverable resend failure: %s', async failure => {
    const onResend = failure === 'network' ? jest.fn().mockRejectedValue(new Error('Offline')) : jest.fn().mockResolvedValue({ status: 'rejected', code: 'invalid_fields' });
    render(<AuthEmailSent {...labels} email="viewer@example.test" initialCooldownSeconds={0} onResend={onResend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send again' }));
    await waitFor(() => expect(screen.getByText('Unable to resend.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Send again' })).toBeEnabled();
  });
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
