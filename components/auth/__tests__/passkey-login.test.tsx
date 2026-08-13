import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PasskeyLogin } from '@/components/auth/passkey-login';
import { signIn } from 'next-auth/webauthn';

jest.mock('next-auth/webauthn', () => ({
  signIn: jest.fn(),
}));

jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

const mockedSignIn = jest.mocked(signIn);

describe('PasskeyLogin', () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true }),
    }) as jest.Mock;
    Object.defineProperty(window, 'PublicKeyCredential', {
      configurable: true,
      value: class PublicKeyCredential {},
    });
  });

  it('stays hidden when the passkey pilot is disabled', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: false }),
    }) as jest.Mock;

    const { container } = render(<PasskeyLogin />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('starts passkey sign-in when the browser and server support it', async () => {
    mockedSignIn.mockResolvedValue(undefined as never);
    render(<PasskeyLogin />);

    const button = await screen.findByRole('button', { name: 'Sign in with a passkey' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith('passkey', {
        redirectTo: '/profiles',
      });
    });
  });

  it('turns a cancelled browser ceremony into a useful retry message', async () => {
    mockedSignIn.mockRejectedValue(new DOMException('Cancelled', 'NotAllowedError'));
    render(<PasskeyLogin />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign in with a passkey' }));

    expect(await screen.findByText('Passkey sign-in was cancelled. You can try again.')).toBeInTheDocument();
  });
});
