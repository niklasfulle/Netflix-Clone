import { render, screen } from '@testing-library/react';

import { CardWrapper } from '../card-wrapper';

jest.mock('@/components/auth/social', () => ({
  Social: () => <div data-testid="social-auth">Social authentication</div>,
}));

describe('CardWrapper', () => {
  const renderWrapper = (showSocial = false) => render(
    <CardWrapper
      headerLabel="Welcome back"
      headerDescription="Sign in to continue."
      backButtonLabel="Create an account"
      backButtonHref="/auth/register"
      showSocial={showSocial}
    >
      <div>Form content</div>
    </CardWrapper>,
  );

  it('labels the auth region with its visible heading', () => {
    renderWrapper();

    const heading = screen.getByRole('heading', { name: 'Welcome back', level: 1 });
    const region = screen.getByRole('region', { name: 'Welcome back' });

    expect(region).toHaveAttribute('aria-labelledby', heading.id);
    expect(screen.getByText('Sign in to continue.')).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('uses a responsive full-width card and renders the back navigation', () => {
    renderWrapper();

    expect(screen.getByRole('region')).toHaveClass('w-full', 'max-w-[30rem]');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/auth/register',
    );
  });

  it('only renders social authentication when requested', () => {
    const { rerender } = renderWrapper();
    expect(screen.queryByTestId('social-auth')).not.toBeInTheDocument();

    rerender(
      <CardWrapper
        headerLabel="Welcome back"
        backButtonLabel="Create an account"
        backButtonHref="/auth/register"
        showSocial
      >
        Form content
      </CardWrapper>,
    );

    expect(screen.getByTestId('social-auth')).toBeInTheDocument();
  });
});
