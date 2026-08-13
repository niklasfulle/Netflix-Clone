import { createPasskeyManagement } from '@/lib/authentication/passkey-management';

describe('createPasskeyManagement', () => {
  it('creates a short-lived grant after successful password reauthentication', async () => {
    const repository = {
      createGrant: jest.fn().mockResolvedValue(undefined),
      hasActiveGrant: jest.fn(),
      cleanupGrants: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
      rename: jest.fn(),
      removeRecoverySafe: jest.fn(),
    };
    const now = new Date('2026-08-12T18:30:00.000Z');
    const management = createPasskeyManagement({
      repository,
      verifyPassword: jest.fn().mockResolvedValue(true),
      createToken: () => 'raw-grant-token',
      hashToken: (token) => `hash:${token}`,
      now: () => now,
    });

    await expect(
      management.authorize({
        userId: 'user-1',
        sessionId: 'session-1',
        password: 'Correct-password-2026',
      }),
    ).resolves.toEqual({
      status: 'authorized',
      token: 'raw-grant-token',
      expiresAt: new Date('2026-08-12T18:35:00.000Z'),
    });
    expect(repository.createGrant).toHaveBeenCalledWith({
      tokenHash: 'hash:raw-grant-token',
      userId: 'user-1',
      sessionId: 'session-1',
      expiresAt: new Date('2026-08-12T18:35:00.000Z'),
    });
    expect(repository.cleanupGrants).toHaveBeenCalledWith(now);
  });

  it('exposes passkeys only while a valid management grant is active', async () => {
    const passkeys = [
      {
        credentialId: 'credential-1',
        label: 'Windows laptop',
        deviceType: 'multiDevice',
        backedUp: true,
        transports: 'internal',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        lastUsedAt: null,
      },
    ];
    const repository = {
      createGrant: jest.fn(),
      hasActiveGrant: jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true),
      cleanupGrants: jest.fn(),
      list: jest.fn().mockResolvedValue(passkeys),
      rename: jest.fn(),
      removeRecoverySafe: jest.fn(),
    };
    const management = createPasskeyManagement({
      repository,
      verifyPassword: jest.fn(),
      createToken: jest.fn(),
      hashToken: (token) => `hash:${token}`,
      now: () => new Date('2026-08-12T18:30:00.000Z'),
    });

    await expect(
      management.list({ userId: 'user-1', sessionId: 'session-1', token: 'grant-token' }),
    ).resolves.toEqual({ status: 'rejected', code: 'reauthentication_required' });
    await expect(
      management.list({ userId: 'user-1', sessionId: 'session-1', token: 'grant-token' }),
    ).resolves.toEqual({ status: 'success', passkeys });
  });

  it('renames only an owned passkey while the grant is active', async () => {
    const repository = {
      createGrant: jest.fn(),
      hasActiveGrant: jest.fn().mockResolvedValue(true),
      cleanupGrants: jest.fn(),
      list: jest.fn(),
      rename: jest.fn().mockResolvedValue(true),
      removeRecoverySafe: jest.fn(),
    };
    const management = createPasskeyManagement({
      repository,
      verifyPassword: jest.fn(),
      createToken: jest.fn(),
      hashToken: (token) => `hash:${token}`,
      now: () => new Date('2026-08-12T18:30:00.000Z'),
    });

    await expect(
      management.rename({
        userId: 'user-1',
        sessionId: 'session-1',
        token: 'grant-token',
        credentialId: 'credential-1',
        label: '  Windows laptop  ',
      }),
    ).resolves.toEqual({ status: 'success' });
    expect(repository.rename).toHaveBeenCalledWith(
      'user-1',
      'credential-1',
      'Windows laptop',
    );
  });

  it('preserves the final usable sign-in method when removing a passkey', async () => {
    const repository = {
      createGrant: jest.fn(),
      hasActiveGrant: jest.fn().mockResolvedValue(true),
      cleanupGrants: jest.fn(),
      list: jest.fn(),
      rename: jest.fn(),
      removeRecoverySafe: jest
        .fn()
        .mockResolvedValueOnce('last_sign_in_method')
        .mockResolvedValue('removed'),
    };
    const management = createPasskeyManagement({
      repository,
      verifyPassword: jest.fn(),
      createToken: jest.fn(),
      hashToken: (token) => `hash:${token}`,
      now: () => new Date('2026-08-12T18:30:00.000Z'),
    });
    const input = {
      userId: 'user-1',
      sessionId: 'session-1',
      token: 'grant-token',
      credentialId: 'credential-1',
    };

    await expect(management.remove(input)).resolves.toEqual({
      status: 'rejected',
      code: 'last_sign_in_method',
    });
    await expect(management.remove(input)).resolves.toEqual({ status: 'success' });
  });
});
