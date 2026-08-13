import { render, screen } from '@testing-library/react';

import { Header } from '../header';

describe('Header', () => {
  it('renders the page label as the primary heading', () => {
    render(<Header id="auth-title" label="Welcome back" description="Sign in to continue." />);

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toHaveAttribute(
      'id',
      'auth-title',
    );
    expect(screen.getByText('Sign in to continue.')).toBeInTheDocument();
    expect(screen.getByText('Netflix Access')).toBeInTheDocument();
  });

  it('omits an empty optional description', () => {
    const { container } = render(<Header label="Reset password" />);

    expect(screen.getByRole('heading', { name: 'Reset password' })).toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it('marks the shield icon as decorative', () => {
    const { container } = render(<Header label="Login" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
