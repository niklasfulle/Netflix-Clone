import { createRecentAuthenticationService } from '../recent-authentication';

describe('recent authentication', () => {
  const now = new Date('2026-08-21T13:00:00.000Z');

  it('grants five minutes only after fresh password and enabled MFA verification', async () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const consume = jest.fn().mockResolvedValue('totp');
    const service = createRecentAuthenticationService({
      users: {
        findById: jest.fn().mockResolvedValue({
          id: 'user-1',
          hashedPassword: 'stored-hash',
          isBlocked: false,
          isTwoFactorEnabled: true,
        }),
      },
      passwords: { verify: jest.fn().mockResolvedValue(true) },
      mfa: { consume },
      grants: { upsert },
      clock: { now: () => now },
    });

    await expect(service.verifyAndGrant({
      userId: 'user-1',
      sessionId: 'session-1',
      password: 'never persisted',
      mfaCode: '123456',
    })).resolves.toEqual({ status: 'verified' });

    expect(consume).toHaveBeenCalledWith('user-1', '123456', now);
    expect(upsert).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId: 'session-1',
      expiresAt: new Date('2026-08-21T13:05:00.000Z'),
    });
  });

  it('fails closed when the password or required MFA proof is invalid', async () => {
    const upsert = jest.fn();
    const service = createRecentAuthenticationService({
      users: {
        findById: jest.fn().mockResolvedValue({
          id: 'user-1',
          hashedPassword: 'stored-hash',
          isBlocked: false,
          isTwoFactorEnabled: true,
        }),
      },
      passwords: { verify: jest.fn().mockResolvedValue(false) },
      mfa: { consume: jest.fn() },
      grants: { upsert },
      clock: { now: () => now },
    });

    await expect(service.verifyAndGrant({
      userId: 'user-1',
      sessionId: 'session-1',
      password: 'wrong',
      mfaCode: '123456',
    })).resolves.toEqual({ status: 'rejected' });
    expect(upsert).not.toHaveBeenCalled();
  });
});
