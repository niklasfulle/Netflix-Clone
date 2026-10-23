import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BackButton } from '../back-button';

describe('BackButton', () => {
  it.each([undefined, 'Signing out…'])('disables repeated submissions and uses the pending label %s', async pendingLabel => {
    let finish!: () => void;
    const action = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<BackButton label="Back to login" href="/auth/login" action={action} pendingLabel={pendingLabel} />);
    fireEvent.submit(screen.getByRole('button', { name: 'Back to login' }).closest('form')!);
    await waitFor(() => expect(screen.getByRole('button', { name: pendingLabel ?? 'Back to login' })).toBeDisabled());
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); });
    expect(screen.getByRole('button', { name: 'Back to login' })).toBeEnabled();
  });
  it('renders semantic navigation with the requested destination', () => {
    render(<BackButton label="Back to login" href="/auth/login" />);

    expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute(
      'href',
      '/auth/login',
    );
  });

  it('provides a full-width touch target and visible keyboard focus styles', () => {
    render(<BackButton label="Back" href="/" />);
    const link = screen.getByRole('link', { name: 'Back' });

    expect(link).toHaveClass('min-h-11', 'w-full');
    expect(link.className).toContain('focus-visible:ring-2');
  });
});
