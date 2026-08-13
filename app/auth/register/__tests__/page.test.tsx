import { render, screen } from '@testing-library/react';

import RegisterPage from '../page';

jest.mock('@/components/auth/register-form', () => ({
  RegisterForm: () => <div data-testid="register-form">Register form</div>,
}));

describe('RegisterPage', () => {
  it('renders the registration form without an unnecessary layout wrapper', () => {
    const { container } = render(<RegisterPage />);

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(container.firstChild).toBe(screen.getByTestId('register-form'));
  });
});
