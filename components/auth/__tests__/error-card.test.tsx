import { render, screen } from '@testing-library/react';

import { ErrorCard } from '../error-card';

jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
jest.mock('@/components/auth/social', () => ({ Social: () => null }));

describe('ErrorCard', () => {
  it('renders a localized error state with a route back to login', () => {
    const { container } = render(<ErrorCard />);

    expect(
      screen.getByRole('heading', { name: 'Oops! Something went wrong!' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Return to sign in and try again.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Login' })).toHaveAttribute(
      'href',
      '/auth/login',
    );
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
