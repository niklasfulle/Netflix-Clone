import { render, screen } from '@testing-library/react';

import LoginPage from '../page';

jest.mock('@/components/auth/login-form', () => ({
  LoginForm: () => <div data-testid="login-form">Login form</div>,
}));

describe('LoginPage', () => {
  it('renders the login form without an unnecessary layout wrapper', () => {
    const { container } = render(<LoginPage />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(container.firstChild).toBe(screen.getByTestId('login-form'));
  });
});
