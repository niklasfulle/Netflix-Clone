import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { login } from '@/actions/login';
import { setNewPassword } from '@/actions/new-password';
import { newVerification } from '@/actions/new-verification';
import { register } from '@/actions/register';
import { reset } from '@/actions/reset-password';
import { resendVerificationEmail } from '@/actions/resend-verification';
import { LoginForm } from '@/components/auth/login-form';
import { NewPasswordForm } from '@/components/auth/new-password-form';
import { NewVerificationForm } from '@/components/auth/new-verification-form';
import { RegisterForm } from '@/components/auth/register-form';
import { ResetForm } from '@/components/auth/reset-form';

const replace = jest.fn();
const refresh = jest.fn();
const getSearchParameter = jest.fn<string | null, [string]>();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => ({ get: getSearchParameter }),
}));

jest.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: () => false,
}));

jest.mock('next-auth/react', () => ({ signIn: jest.fn() }));

jest.mock('@/actions/login', () => ({ login: jest.fn() }));
jest.mock('@/actions/new-password', () => ({ setNewPassword: jest.fn() }));
jest.mock('@/actions/new-verification', () => ({ newVerification: jest.fn() }));
jest.mock('@/actions/register', () => ({ register: jest.fn() }));
jest.mock('@/actions/reset-password', () => ({ reset: jest.fn() }));
jest.mock('@/actions/resend-verification', () => ({
  resendVerificationEmail: jest.fn(),
}));
jest.mock('@/components/auth/passkey-login', () => ({
  PasskeyLogin: () => <div data-testid="passkey-login" />,
}));
jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

const mockedLogin = jest.mocked(login);
const mockedSetNewPassword = jest.mocked(setNewPassword);
const mockedNewVerification = jest.mocked(newVerification);
const mockedRegister = jest.mocked(register);
const mockedReset = jest.mocked(reset);

function submitLogin() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'viewer@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'valid-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
}

describe('auth form interactions', () => {
  it('resends account verification after the registration email cooldown', async () => {
    jest.useFakeTimers();
    try {
      mockedRegister.mockResolvedValueOnce({ status: 'success', code: 'verification_sent' });
      jest.mocked(resendVerificationEmail).mockResolvedValueOnce({ status: 'success', code: 'verification_sent' });
      render(<RegisterForm />);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Register' })).toBeEnabled());
      for (const [label, value] of Object.entries({ 'Full name': 'Viewer', Email: 'viewer@example.test', Password: 'valid-password-123', 'Confirm password': 'valid-password-123' })) fireEvent.change(screen.getByLabelText(label), { target: { value } });
      fireEvent.click(screen.getByRole('button', { name: 'Register' }));
      await screen.findByText('viewer@example.test');
      act(() => { jest.advanceTimersByTime(60_000); });
      fireEvent.click(screen.getByRole('button', { name: 'Send again' }));
      await waitFor(() => expect(resendVerificationEmail).toHaveBeenCalledWith({ email: 'viewer@example.test' }));
    } finally { jest.useRealTimers(); }
  });
  it.each([
    { name: 'login', Component: LoginForm, action: mockedLogin, button: 'Login', fields: { Email: 'viewer@example.test', Password: 'valid-password-123' } },
    { name: 'registration', Component: RegisterForm, action: mockedRegister, button: 'Register', fields: { 'Full name': 'Viewer', Email: 'viewer@example.test', Password: 'valid-password-123', 'Confirm password': 'valid-password-123' } },
    { name: 'password reset', Component: ResetForm, action: mockedReset, button: 'Send reset email', fields: { Email: 'viewer@example.test' } },
    { name: 'password update', Component: NewPasswordForm, action: mockedSetNewPassword, button: 'Set Password', fields: { 'New Password': 'valid-password-123', 'Confirm password': 'valid-password-123' } },
  ])('keeps the $name form recoverable after a failed server request', async ({ Component, action, button, fields }) => {
    getSearchParameter.mockReturnValue('test-token');
    action.mockRejectedValueOnce(new Error('Network unavailable'));
    render(<Component />);
    await waitFor(() => expect(screen.getByRole('button', { name: button })).toBeEnabled());
    for (const [label, value] of Object.entries(fields)) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: button }));
    expect(await screen.findByText('Something went wrong!')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: button })).toBeEnabled());
  });

  it.each([
    { status: 'rejected', code: 'token_expired', message: 'Token has expired!' },
    { status: 'retry', code: 'rate_limited', retryAfterSeconds: 60, message: 'Too many attempts. Please try again later.' },
  ] as const)('shows terminal verification feedback without restarting the request: $status', async ({ message, ...result }) => {
    getSearchParameter.mockReturnValue('test-token');
    mockedNewVerification.mockResolvedValueOnce(result);
    render(<NewVerificationForm />);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(mockedNewVerification).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable message if automatic verification cannot reach the server', async () => {
    getSearchParameter.mockReturnValue('test-token');
    mockedNewVerification.mockRejectedValueOnce(new Error('Offline'));
    render(<NewVerificationForm />);
    expect(await screen.findByText('Something went wrong!')).toBeInTheDocument();
    expect(mockedNewVerification).toHaveBeenCalledTimes(1);
  });

  it('allows requesting a fresh password reset email after the cooldown', async () => {
    jest.useFakeTimers();
    try {
      mockedReset.mockResolvedValue({ status: 'success', code: 'password_reset_sent' });
      render(<ResetForm />);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send reset email' })).toBeEnabled());
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'VIEWER@EXAMPLE.TEST' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send reset email' }));
      expect(await screen.findByText('viewer@example.test')).toBeInTheDocument();
      act(() => { jest.advanceTimersByTime(60_000); });
      fireEvent.click(screen.getByRole('button', { name: 'Send again' }));
      await waitFor(() => expect(mockedReset).toHaveBeenLastCalledWith({ email: 'viewer@example.test' }));
      expect(mockedReset).toHaveBeenCalledTimes(2);
    } finally { jest.useRealTimers(); }
  });
  beforeEach(() => {
    jest.clearAllMocks();
    getSearchParameter.mockReturnValue(null);
  });

  it('signs in with credentials and navigates to the protected application', async () => {
    mockedLogin.mockResolvedValue({ status: 'success', code: 'signed_in' });
    render(<LoginForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled());
    submitLogin();

    await waitFor(() => expect(mockedLogin).toHaveBeenCalledWith({
      email: 'viewer@example.test',
      password: 'valid-password',
    }));
    expect(replace).toHaveBeenCalledWith('/profiles');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('moves from password login into the authenticator challenge and submits its code', async () => {
    mockedLogin
      .mockResolvedValueOnce({
        status: 'challenge',
        code: 'two_factor_required',
        challenge: 'totp',
        canUseEmailFallback: true,
      })
      .mockResolvedValueOnce({ status: 'success', code: 'signed_in' });
    render(<LoginForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled());
    submitLogin();
    const codeInput = await screen.findByLabelText('Authenticator code');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(mockedLogin).toHaveBeenLastCalledWith({
      email: 'viewer@example.test',
      password: 'valid-password',
      code: '123456',
      challengeMethod: 'totp',
    }));
  });

  it('shows rejected login feedback', async () => {
    mockedLogin.mockResolvedValue({ status: 'rejected', code: 'invalid_credentials' });
    render(<LoginForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled());
    submitLogin();

    expect(await screen.findByText('Invalid credentials!')).toBeInTheDocument();
  });

  it('registers a normalized account and displays the verification destination', async () => {
    mockedRegister.mockResolvedValue({ status: 'success', code: 'verification_sent' });
    render(<RegisterForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Register' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Viewer' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'VIEWER@EXAMPLE.TEST' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'valid-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'valid-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('viewer@example.test')).toBeInTheDocument();
    expect(mockedRegister).toHaveBeenCalledTimes(1);
  });

  it('reports registration failures without replacing the form', async () => {
    mockedRegister.mockResolvedValue({ status: 'rejected', code: 'email_in_use' });
    render(<RegisterForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Register' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Viewer' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'viewer@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'valid-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'valid-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Email already in use!')).toBeInTheDocument();
  });

  it('requests a password reset and displays the normalized email address', async () => {
    mockedReset.mockResolvedValue({ status: 'success', code: 'password_reset_sent' });
    render(<ResetForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send reset email' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'VIEWER@EXAMPLE.TEST' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset email' }));

    expect(await screen.findByText('viewer@example.test')).toBeInTheDocument();
  });

  it('shows password-reset request errors', async () => {
    mockedReset.mockResolvedValue({ status: 'rejected', code: 'delivery_failed' });
    render(<ResetForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send reset email' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'viewer@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset email' }));

    expect(await screen.findByText('Email delivery failed. Please try again.')).toBeInTheDocument();
  });

  it('sets a new password using the token from the URL', async () => {
    getSearchParameter.mockImplementation((key) => key === 'token' ? 'reset-token' : null);
    mockedSetNewPassword.mockResolvedValue({ status: 'success', code: 'password_updated' });
    render(<NewPasswordForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Set Password' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'valid-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'valid-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set Password' }));

    await waitFor(() => expect(mockedSetNewPassword).toHaveBeenCalledWith({
      password: 'valid-password-123',
      confirm: 'valid-password-123',
    }, 'reset-token'));
    expect(await screen.findByText('New password set!')).toBeInTheDocument();
  });

  it('shows errors returned while setting a new password', async () => {
    getSearchParameter.mockReturnValue('expired-token');
    mockedSetNewPassword.mockResolvedValue({ status: 'rejected', code: 'token_expired' });
    render(<NewPasswordForm />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Set Password' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'valid-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'valid-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set Password' }));

    expect(await screen.findByText('Token has expired!')).toBeInTheDocument();
  });

  it('verifies an email token automatically', async () => {
    getSearchParameter.mockReturnValue('verification-token');
    mockedNewVerification.mockResolvedValue({ status: 'success', code: 'email_verified' });
    render(<NewVerificationForm />);

    expect(await screen.findByText('Email verified!')).toBeInTheDocument();
    expect(mockedNewVerification).toHaveBeenCalledWith('verification-token');
  });

  it('rejects verification pages without a token', async () => {
    render(<NewVerificationForm />);

    expect(await screen.findByText('Missing token!')).toBeInTheDocument();
    expect(mockedNewVerification).not.toHaveBeenCalled();
  });
});
