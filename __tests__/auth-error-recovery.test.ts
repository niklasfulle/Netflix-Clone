/** @jest-environment node */

jest.mock('next-auth', () => ({
  __esModule: true,
  default: () => ({ auth: (handler: unknown) => handler }),
}));
jest.mock('@/auth.config', () => ({ __esModule: true, default: {} }));
jest.mock('@/lib/authentication/proxy-configuration', () => ({
  createProxyAuthenticationConfig: () => ({}),
}));
jest.mock('@/lib/session-security', () => ({
  sessionSecurity: { isAuthorized: jest.fn() },
}));
jest.mock('@/auth', () => ({ signOut: jest.fn() }));
jest.mock('@/lib/authentication/production-telemetry', () => ({
  authenticationTelemetry: { start: () => ({ complete: jest.fn() }) },
}));

import proxy from '@/proxy';
import { logout } from '@/actions/logout';
import { signOut } from '@/auth';
import { sessionSecurity } from '@/lib/session-security';

type Session = { user: { id: string; isBlocked?: boolean; isRevoked?: boolean } } | null;
const handleProxy = proxy as unknown as (request: { auth: Session; nextUrl: URL }) => Promise<Response | undefined>;

it.each([{ isBlocked: true }, { isRevoked: true }])(
  'lets a rejected session leave the error page through logout: %j',
  async (flags) => {
    jest.clearAllMocks();
    let session: Session = { user: { id: 'user-1', ...flags } };
    (sessionSecurity.isAuthorized as jest.Mock).mockResolvedValue(false);
    (signOut as jest.Mock).mockImplementation(async () => { session = null; });
    const visit = (path: string) => handleProxy({ auth: session, nextUrl: new URL(path, 'http://netflix') });

    // A plain link to login sends the rejected session straight back to the same error page.
    const loginWithOldSession = await visit('/auth/login');
    expect(loginWithOldSession?.headers.get('location')).toBe('http://netflix/auth/error?error=AccessDenied');
    expect(await visit('/auth/error')).toBeUndefined();

    await logout();

    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/auth/login' });
    expect(await visit('/auth/login')).toBeUndefined();
    const protectedPage = await visit('/profiles');
    expect(protectedPage?.headers.get('location')).toBe('http://netflix/auth/login');
  },
);
