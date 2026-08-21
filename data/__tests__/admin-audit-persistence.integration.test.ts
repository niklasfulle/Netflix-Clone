/** @jest-environment node */

import { adminAuditRepository } from '@/data/admin-audit';
import { createAdminAudit } from '@/lib/administration/admin-audit';
import { db } from '@/lib/db';
import { assertIsolatedStagingDatabase } from '@/tests/integration/database-safety';

const databaseTest = process.env.RUN_ADMIN_AUDIT_DATABASE_INTEGRATION === 'true'
  ? describe
  : describe.skip;

databaseTest('PostgreSQL administrator audit persistence', () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const actorUserId = `audit-integration-${suffix}`;
  const now = new Date('2026-08-14T10:00:00.000Z');

  beforeAll(async () => {
    await assertIsolatedStagingDatabase();
  });

  afterAll(async () => {
    await db.adminAuditEvent.deleteMany({ where: { actorUserId } }).catch(() => undefined);
    await db.$disconnect();
  });

  it('persists concurrent events without storing rejected metadata', async () => {
    let sequence = 0;
    const audit = createAdminAudit({
      repository: adminAuditRepository,
      resolveActor: async () => ({ userId: actorUserId, role: 'ADMIN' }),
      now: () => now,
      createId: () => `audit-${suffix}-${sequence++}`,
    });

    await Promise.all(Array.from({ length: 10 }, (_, index) => audit.record({
      action: 'media.scan',
      target: { type: 'content', id: `movie-${index}` },
      outcome: index % 2 === 0 ? 'SUCCEEDED' : 'FAILED',
      metadata: {
        scope: 'single-content',
        itemCount: 1,
        token: `must-not-be-stored-${index}`,
      },
    })));

    const events = await db.adminAuditEvent.findMany({
      where: { actorUserId },
      orderBy: { id: 'asc' },
    });
    expect(events).toHaveLength(10);
    expect(events.every((event) => event.actorRole === 'ADMIN')).toBe(true);
    expect(JSON.stringify(events)).not.toContain('must-not-be-stored');
  });

  it('rejects direct updates and preserves the original event', async () => {
    const id = `immutable-${suffix}`;
    await db.adminAuditEvent.create({
      data: {
        id,
        actorUserId,
        actorRole: 'ADMIN',
        action: 'content.delete',
        targetType: 'content',
        targetId: 'movie-1',
        outcome: 'SUCCEEDED',
        createdAt: now,
      },
    });

    await expect(db.adminAuditEvent.update({
      where: { id },
      data: { outcome: 'FAILED' },
    })).rejects.toThrow();
    await expect(db.adminAuditEvent.findUnique({
      where: { id },
      select: { outcome: true },
    })).resolves.toEqual({ outcome: 'SUCCEEDED' });
  });

  it('installs the indexes required by audit lookup and retention queries', async () => {
    const indexes = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND tablename = 'AdminAuditEvent'
    `;

    expect(indexes.map(({ indexname }) => indexname).sort()).toEqual(expect.arrayContaining([
      'AdminAuditEvent_action_outcome_createdAt_idx',
      'AdminAuditEvent_actorUserId_createdAt_idx',
      'AdminAuditEvent_createdAt_idx',
      'AdminAuditEvent_targetType_targetId_createdAt_idx',
    ]));
  });

  it('removes only one bounded batch of expired events', async () => {
    await db.adminAuditEvent.deleteMany({ where: { actorUserId } });
    await db.adminAuditEvent.createMany({
      data: [
        ...Array.from({ length: 105 }, (_, index) => ({
          id: `expired-${suffix}-${index}`,
          actorUserId,
          actorRole: 'ADMIN',
          action: 'backup.create',
          outcome: 'SUCCEEDED',
          createdAt: new Date('2025-08-13T09:59:59.000Z'),
        })),
        {
          id: `current-${suffix}`,
          actorUserId,
          actorRole: 'ADMIN',
          action: 'backup.create',
          outcome: 'SUCCEEDED',
          createdAt: now,
        },
      ],
    });
    const audit = createAdminAudit({
      repository: adminAuditRepository,
      resolveActor: async () => ({ userId: actorUserId, role: 'ADMIN' }),
      now: () => now,
      createId: () => 'unused',
    });

    await expect(audit.maintainRetention()).resolves.toEqual({ removed: 100 });
    await expect(db.adminAuditEvent.count({
      where: { actorUserId, createdAt: { lt: new Date('2025-08-14T10:00:00.000Z') } },
    })).resolves.toBe(5);
    await expect(db.adminAuditEvent.count({
      where: { actorUserId, createdAt: { gte: new Date('2025-08-14T10:00:00.000Z') } },
    })).resolves.toBe(1);
  });
});
