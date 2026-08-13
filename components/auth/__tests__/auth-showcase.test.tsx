import { render, screen } from '@testing-library/react';

import { AuthShowcase } from '../auth-showcase';

jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe('AuthShowcase', () => {
  it('summarizes the product benefits for large screens', () => {
    const { container } = render(<AuthShowcase />);

    expect(
      screen.getByRole('heading', { name: 'Your library. Your profiles. Your night.' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Personal profiles')).toBeInTheDocument();
    expect(screen.getByText('Continue where you stopped')).toBeInTheDocument();
    expect(screen.getByText('Your media stays yours')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('hidden', 'lg:block');
  });
});
