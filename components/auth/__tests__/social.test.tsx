import { fireEvent, render, screen } from '@testing-library/react';
import { signIn } from 'next-auth/react';

import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

import { Social } from '../social';

jest.mock('next-auth/react', () => ({ signIn: jest.fn() }));
jest.mock('@/components/providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe('Social', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exposes named provider buttons instead of icon-only controls', () => {
    render(<Social />);

    expect(screen.getByText('or continue with')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GitHub' })).toBeInTheDocument();
  });

  it.each(['google', 'github'] as const)('starts %s sign-in with the default redirect', (provider) => {
    render(<Social />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(provider, 'i') }));

    expect(signIn).toHaveBeenCalledWith(provider, { callbackUrl: DEFAULT_LOGIN_REDIRECT });
  });
});
