jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/session-security', () => ({
  currentSecurityContext: jest.fn(),
  sessionSecurity: {
    getRecentActivity: jest.fn(),
    revokeOtherSessions: jest.fn(),
  },
}));

import { currentUser } from '@/lib/auth';
import { currentSecurityContext, sessionSecurity } from '@/lib/session-security';

import { getSecurityActivity, revokeOtherSessions } from '../session-security';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('session security actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      sessionId: 'current-session',
    } as never);
  });

  it('returns recent activity only for the authenticated account', async () => {
    (sessionSecurity.getRecentActivity as jest.Mock).mockResolvedValue([
      { id: 'event-1', event: 'signed_in', createdAt: new Date('2026-08-12T10:00:00.000Z') },
    ]);

    await expect(getSecurityActivity()).resolves.toEqual({
      status: 'success',
      activity: [
        { id: 'event-1', event: 'signed_in', createdAt: '2026-08-12T10:00:00.000Z' },
      ],
    });
    expect(sessionSecurity.getRecentActivity).toHaveBeenCalledWith('user-1');
  });

  it('revokes other sessions while preserving the current device', async () => {
    (currentSecurityContext as jest.Mock).mockResolvedValue({ address: '192.0.2.10' });
    (sessionSecurity.revokeOtherSessions as jest.Mock).mockResolvedValue({ revoked: 2 });

    await expect(revokeOtherSessions()).resolves.toEqual({
      status: 'success',
      code: 'other_sessions_revoked',
      revoked: 2,
    });
    expect(sessionSecurity.revokeOtherSessions).toHaveBeenCalledWith({
      userId: 'user-1',
      currentSessionId: 'current-session',
      context: { address: '192.0.2.10' },
    });
  });

  it('rejects missing and unregistered sessions', async () => {
    mockCurrentUser.mockResolvedValue(undefined);
    await expect(getSecurityActivity()).resolves.toEqual({
      status: 'rejected',
      code: 'unauthorized',
    });

    mockCurrentUser.mockResolvedValue({ id: 'user-1' } as never);
    await expect(revokeOtherSessions()).resolves.toEqual({
      status: 'rejected',
      code: 'session_unavailable',
    });
    expect(sessionSecurity.revokeOtherSessions).not.toHaveBeenCalled();
  });
});
