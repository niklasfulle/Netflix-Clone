import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ErrorCard } from '../error-card';
import { logout } from '@/actions/logout';

jest.mock('@/actions/logout', () => ({ logout: jest.fn() }));

jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
jest.mock('@/components/auth/social', () => ({ Social: () => null }));

describe('ErrorCard', () => {
  beforeEach(() => { jest.clearAllMocks(); });
  it('renders a localized error state with a route back to login', () => {
    const { container } = render(<ErrorCard />);

    expect(
      screen.getByRole('heading', { name: 'Oops! Something went wrong!' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Return to sign in and try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Login' })).toBeEnabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Your current sign-in could not be used. Return to sign in to start a new session.');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('ends the old session when returning to sign in rather than navigating with the rejected session', async () => {
    (logout as jest.Mock).mockResolvedValue(undefined);
    render(<ErrorCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Login' }));
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
  });

  it('acknowledges the tap and prevents repeated submissions while signing out', async () => {
    let finish!: () => void;
    (logout as jest.Mock).mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(<ErrorCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Login' }));
    const pendingButton = await screen.findByRole('button', { name: 'Returning to sign in...' });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
    await act(async () => { finish(); });
  });
});
