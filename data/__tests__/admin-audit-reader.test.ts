jest.mock('@/lib/db', () => ({
  db: {
    adminAuditEvent: { count: jest.fn(), findMany: jest.fn() },
    user: { findMany: jest.fn() },
  },
}));

import { adminAuditReadRepository } from '@/data/admin-audit-reader';
import { db } from '@/lib/db';

describe('administrator audit read repository', () => {
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
