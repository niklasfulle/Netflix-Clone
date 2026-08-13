import { createSessionSecurity, type SessionSecurityRepository } from '../session-security';

const now = new Date('2026-08-12T10:00:00.000Z');

function createRepository(): jest.Mocked<SessionSecurityRepository> {
  return {
    create: jest.fn(),
    findActive: jest.fn(),
    getLegacyCutoff: jest.fn(),
    touch: jest.fn(),
    revokeAll: jest.fn(),
    revokeOne: jest.fn(),
    revokeOthers: jest.fn(),
    setLegacyCutoff: jest.fn(),
    recordActivity: jest.fn(),
    listActivity: jest.fn(),
    removeActivityBefore: jest.fn(),
  };
}

describe('session security module', () => {
  it('establishes a registered session without persisting a raw client address', async () => {
    const repository = createRepository();
    repository.getLegacyCutoff.mockResolvedValue(null);
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'session-1',
      hashAddress: () => 'opaque-address-hash',
    });

    await expect(security.authenticate({
      userId: 'user-1',
      issuedAt: new Date('2026-08-12T09:59:00.000Z'),
      expiresAt: new Date('2026-09-12T10:00:00.000Z'),
      context: {
        address: '192.0.2.10',
        userAgent: 'Browser/1.0',
      },
    })).resolves.toEqual({ status: 'active', sessionId: 'session-1' });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      id: 'session-1',
      userId: 'user-1',
      ipHash: 'opaque-address-hash',
      userAgent: 'Browser/1.0',
    }));
    expect(repository.recordActivity).toHaveBeenCalledWith(expect.objectContaining({
      event: 'signed_in',
      ipHash: 'opaque-address-hash',
    }));
    expect(JSON.stringify(repository.create.mock.calls)).not.toContain('192.0.2.10');
  });

  it('rejects a legacy JWT issued before the account cutoff', async () => {
    const repository = createRepository();
    repository.getLegacyCutoff.mockResolvedValue(new Date('2026-08-12T09:30:00.000Z'));
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'session-1',
      hashAddress: () => 'hash',
    });

    await expect(security.authenticate({
      userId: 'user-1',
      issuedAt: new Date('2026-08-12T09:00:00.000Z'),
      expiresAt: new Date('2026-09-12T10:00:00.000Z'),
    })).resolves.toEqual({ status: 'revoked' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a revoked or expired registered session', async () => {
    const repository = createRepository();
    repository.findActive.mockResolvedValue(false);
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'unused',
      hashAddress: () => 'hash',
    });

    await expect(security.authenticate({
      userId: 'user-1',
      sessionId: 'revoked-session',
      issuedAt: new Date('2026-08-12T09:00:00.000Z'),
      expiresAt: new Date('2026-09-12T10:00:00.000Z'),
    })).resolves.toEqual({ status: 'revoked' });
    expect(repository.touch).not.toHaveBeenCalled();
  });

  it('authorizes proxy requests only while the registered session remains active', async () => {
    const repository = createRepository();
    repository.findActive.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'unused',
      hashAddress: () => 'hash',
    });

    const request = {
      userId: 'user-1',
      sessionId: 'current-session',
      issuedAt: new Date('2026-08-12T09:00:00.000Z'),
    };
    await expect(security.isAuthorized(request)).resolves.toBe(true);
    await expect(security.isAuthorized(request)).resolves.toBe(false);
  });

  it('rejects unregistered legacy JWTs older than the revocation cutoff', async () => {
    const repository = createRepository();
    repository.getLegacyCutoff.mockResolvedValue(new Date('2026-08-12T09:30:00.000Z'));
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'unused',
      hashAddress: () => 'hash',
    });

    await expect(security.isAuthorized({
      userId: 'user-1',
      issuedAt: new Date('2026-08-12T09:00:00.000Z'),
    })).resolves.toBe(false);
  });

  it('revokes every other device while preserving the current session', async () => {
    const repository = createRepository();
    repository.revokeOthers.mockResolvedValue(2);
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'unused',
      hashAddress: () => 'hash',
    });

    await expect(security.revokeOtherSessions({
      userId: 'user-1',
      currentSessionId: 'current-session',
    })).resolves.toEqual({ revoked: 2 });

    expect(repository.setLegacyCutoff).toHaveBeenCalledWith('user-1', now);
    expect(repository.revokeOthers).toHaveBeenCalledWith('user-1', 'current-session', now);
    expect(repository.recordActivity).toHaveBeenCalledWith(expect.objectContaining({
      event: 'other_sessions_revoked',
      details: { revoked: 2 },
    }));
  });

  it('revokes every session for recovery and account-security changes', async () => {
    const repository = createRepository();
    repository.revokeAll.mockResolvedValue(3);
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'unused',
      hashAddress: () => 'hash',
    });

    await expect(security.revokeAllSessions({
      userId: 'user-1',
      event: 'password_reset',
    })).resolves.toEqual({ revoked: 3 });

    expect(repository.setLegacyCutoff).toHaveBeenCalledWith('user-1', now);
    expect(repository.revokeAll).toHaveBeenCalledWith('user-1', now);
    expect(repository.recordActivity).toHaveBeenCalledWith(expect.objectContaining({
      event: 'password_reset',
    }));
  });

  it('revokes the current registered session during sign-out', async () => {
    const repository = createRepository();
    repository.revokeOne.mockResolvedValue(true);
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'unused',
      hashAddress: () => 'hash',
    });

    await security.revokeCurrentSession({
      userId: 'user-1',
      sessionId: 'current-session',
    });

    expect(repository.revokeOne).toHaveBeenCalledWith(
      'user-1',
      'current-session',
      now,
    );
    expect(repository.recordActivity).toHaveBeenCalledWith(expect.objectContaining({
      event: 'signed_out',
    }));
  });

  it('returns recent security activity and performs bounded retention cleanup', async () => {
    const repository = createRepository();
    repository.listActivity.mockResolvedValue([{ id: 'event-1', event: 'signed_in', createdAt: now }]);
    const security = createSessionSecurity({
      repository,
      now: () => now,
      createId: () => 'unused',
      hashAddress: () => 'hash',
    });

    await expect(security.getRecentActivity('user-1')).resolves.toEqual([
      { id: 'event-1', event: 'signed_in', createdAt: now },
    ]);
    expect(repository.listActivity).toHaveBeenCalledWith('user-1', 20);
    expect(repository.removeActivityBefore).toHaveBeenCalledWith(
      new Date('2026-05-14T10:00:00.000Z'),
      25,
    );
  });
});
