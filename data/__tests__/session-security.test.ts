/** @jest-environment node */

const mockAuthSession = {
  create: jest.fn(),
  count: jest.fn(),
  updateMany: jest.fn(),
};
const mockUser = { findUnique: jest.fn(), update: jest.fn() };
const mockSecurityActivity = { create: jest.fn(), findMany: jest.fn() };
const mockExecuteRaw = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    authSession: {
      create: (...args: unknown[]) => mockAuthSession.create(...args),
      count: (...args: unknown[]) => mockAuthSession.count(...args),
      updateMany: (...args: unknown[]) => mockAuthSession.updateMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUser.findUnique(...args),
      update: (...args: unknown[]) => mockUser.update(...args),
    },
    securityActivity: {
      create: (...args: unknown[]) => mockSecurityActivity.create(...args),
      findMany: (...args: unknown[]) => mockSecurityActivity.findMany(...args),
    },
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
  },
}));

import { sessionSecurityRepository } from '@/data/session-security';

describe('session security persistence adapter', () => {
  const now = new Date('2026-08-12T20:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates, validates, touches, and reads legacy session state', async () => {
    const session = {
      id: 'session-1',
      userId: 'user-1',
      issuedAt: now,
      expiresAt: new Date('2026-08-13T20:00:00.000Z'),
      ipHash: 'ip-hash',
      userAgent: 'Test Browser',
    };
    mockAuthSession.create.mockResolvedValue(session);
    mockAuthSession.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    mockAuthSession.updateMany.mockResolvedValue({ count: 1 });
    mockUser.findUnique
      .mockResolvedValueOnce({ sessionsInvalidBefore: now })
      .mockResolvedValueOnce(null);

    await sessionSecurityRepository.create(session);
    await expect(sessionSecurityRepository.findActive('session-1', 'user-1', now)).resolves.toBe(true);
    await expect(sessionSecurityRepository.findActive('missing', 'user-1', now)).resolves.toBe(false);
    await expect(sessionSecurityRepository.getLegacyCutoff('user-1')).resolves.toBe(now);
    await expect(sessionSecurityRepository.getLegacyCutoff('missing')).resolves.toBeNull();
    await sessionSecurityRepository.touch('session-1', now);

    expect(mockAuthSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        lastSeenAt: { lte: new Date(now.getTime() - 15 * 60_000) },
      },
      data: { lastSeenAt: now },
    });
  });

  it('revokes all, one, or all other sessions and reports affected rows', async () => {
    mockAuthSession.updateMany
      .mockResolvedValueOnce({ count: 3 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 2 });

    await expect(sessionSecurityRepository.revokeAll('user-1', now)).resolves.toBe(3);
    await expect(sessionSecurityRepository.revokeOne('user-1', 'session-1', now)).resolves.toBe(true);
    await expect(sessionSecurityRepository.revokeOne('user-1', 'missing', now)).resolves.toBe(false);
    await expect(sessionSecurityRepository.revokeOthers('user-1', 'session-1', now)).resolves.toBe(2);
  });

  it('updates legacy cutoffs and records privacy-safe activity details', async () => {
    mockUser.update.mockResolvedValue({ id: 'user-1' });
    mockSecurityActivity.create.mockResolvedValue({ id: 'activity-1' });

    await sessionSecurityRepository.setLegacyCutoff('user-1', now);
    await sessionSecurityRepository.recordActivity({
      userId: 'user-1',
      event: 'signed_in',
      createdAt: now,
      ipHash: 'ip-hash',
      userAgent: 'Test Browser',
      details: { revoked: 2 },
    });
    await sessionSecurityRepository.recordActivity({
      userId: 'user-1',
      event: 'signed_out',
      createdAt: now,
      ipHash: null,
      userAgent: null,
    });

    expect(mockUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { sessionsInvalidBefore: now },
    });
    expect(mockSecurityActivity.create.mock.calls[0][0].data.details)
      .toEqual({ revoked: 2 });
    expect(mockSecurityActivity.create.mock.calls[1][0].data.details).toBeDefined();
  });

  it('lists recent activity and removes old rows in bounded batches', async () => {
    const activity = [{ id: 'activity-1', event: 'signed_in', createdAt: now }];
    mockSecurityActivity.findMany.mockResolvedValue(activity);
    mockExecuteRaw.mockResolvedValue(2);

    await expect(sessionSecurityRepository.listActivity('user-1', 20)).resolves.toEqual(activity);
    await sessionSecurityRepository.removeActivityBefore(now, 100);

    expect(mockSecurityActivity.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, event: true, createdAt: true, userAgent: true },
    });
    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
  });
});
