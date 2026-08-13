import { render, screen } from '@testing-library/react';

import { BackButton } from '../back-button';

describe('BackButton', () => {
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
