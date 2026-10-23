jest.mock('@/lib/db', () => ({
  db: {
    adminAuditEvent: { count: jest.fn(), findMany: jest.fn() },
    user: { findMany: jest.fn() },
  },
}));

import { adminAuditReadRepository } from '@/data/admin-audit-reader';
import { db } from '@/lib/db';

describe('administrator audit read repository', () => {
  it.each(['from', 'to'] as const)('applies a one-sided %s date filter when no matching actor exists', async boundary => {
    jest.mocked(db.adminAuditEvent.count).mockResolvedValue(0);
    jest.mocked(db.adminAuditEvent.findMany).mockResolvedValue([]);
    jest.mocked(db.user.findMany).mockResolvedValue([]);
    const date = new Date('2026-08-01T00:00:00.000Z');
    await adminAuditReadRepository.search({ page: 1, pageSize: 20, actor: 'removed-account', [boundary]: date });
    expect(db.adminAuditEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { OR: [{ actorUserId: { contains: 'removed-account', mode: 'insensitive' } }], createdAt: { [boundary === 'from' ? 'gte' : 'lte']: date } } }));
  });

  it('returns retained events even when account names or actor identifiers are absent', async () => {
    jest.mocked(db.adminAuditEvent.count).mockResolvedValue(2);
    jest.mocked(db.adminAuditEvent.findMany).mockResolvedValue([{ id: 'system-event', actorUserId: null }, { id: 'removed-account-event', actorUserId: 'removed' }] as never);
    jest.mocked(db.user.findMany).mockResolvedValue([]);
    await expect(adminAuditReadRepository.search({ page: 1, pageSize: 20 })).resolves.toEqual({ total: 2, events: [{ id: 'system-event', actorUserId: null, actorName: null }, { id: 'removed-account-event', actorUserId: 'removed', actorName: null }] });
  });
  beforeEach(() => jest.resetAllMocks());

  it('filters and paginates in Prisma and resolves an optional actor name', async () => {
    (db.adminAuditEvent.count as jest.Mock).mockResolvedValue(21);
    (db.adminAuditEvent.findMany as jest.Mock).mockResolvedValue([{
      id: 'event-1',
      actorUserId: 'admin-1',
      actorRole: 'ADMIN',
      action: 'content.publish',
      targetType: 'content',
      targetId: 'movie-1',
      outcome: 'SUCCEEDED',
      correlationId: 'correlation-1',
      metadata: { previousStatus: 'DRAFT' },
      createdAt: new Date('2026-08-14T10:00:00.000Z'),
    }]);
    (db.user.findMany as jest.Mock).mockResolvedValue([{ id: 'admin-1', name: 'Admin User' }]);

    await expect(adminAuditReadRepository.search({
      page: 2,
      pageSize: 20,
      action: 'content.publish',
      targetType: 'content',
      outcome: 'SUCCEEDED',
      from: new Date('2026-08-01T00:00:00.000Z'),
      to: new Date('2026-08-14T23:59:59.999Z'),
    })).resolves.toEqual({
      total: 21,
      events: [expect.objectContaining({ id: 'event-1', actorName: 'Admin User' })],
    });

    expect(db.adminAuditEvent.findMany).toHaveBeenCalledWith({
      where: {
        action: 'content.publish',
        targetType: 'content',
        outcome: 'SUCCEEDED',
        createdAt: {
          gte: new Date('2026-08-01T00:00:00.000Z'),
          lte: new Date('2026-08-14T23:59:59.999Z'),
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 20,
      take: 20,
    });
  });

  it('matches actors by account name, email, or retained actor id', async () => {
    (db.user.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 'admin-1' }])
      .mockResolvedValueOnce([]);
    (db.adminAuditEvent.count as jest.Mock).mockResolvedValue(0);
    (db.adminAuditEvent.findMany as jest.Mock).mockResolvedValue([]);

    await adminAuditReadRepository.search({
      page: 1,
      pageSize: 20,
      actor: 'Niklas',
    });

    expect(db.user.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        OR: [
          { id: { contains: 'Niklas', mode: 'insensitive' } },
          { name: { contains: 'Niklas', mode: 'insensitive' } },
          { email: { contains: 'Niklas', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take: 100,
    });
    expect(db.adminAuditEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { actorUserId: { contains: 'Niklas', mode: 'insensitive' } },
          { actorUserId: { in: ['admin-1'] } },
        ],
      },
    }));
  });
});
