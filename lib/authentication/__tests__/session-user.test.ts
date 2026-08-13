import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

import { applySessionIdentity } from '@/lib/authentication/session-user';

describe('applySessionIdentity', () => {
  it('copies the token subject and security state into the session user', () => {
    const session = {
      user: { name: 'Test User', email: 'user@example.test' },
      expires: '2026-09-12T00:00:00.000Z',
    } as Session;
    const token = {
      sub: 'user-1',
      role: 'USER',
      isBlocked: false,
      isRevoked: false,
      sessionId: 'session-1',
      iat: 1_786_000_000,
    } as JWT;

    expect(applySessionIdentity(session, token).user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        role: 'USER',
        isBlocked: false,
        isRevoked: false,
        sessionId: 'session-1',
        sessionIssuedAt: 1_786_000_000,
      }),
    );
  });
});
