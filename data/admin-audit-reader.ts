import type { Prisma } from '@prisma/client';

import type {
  AdminAuditReadEvent,
  AdminAuditReadRepository,
  AdminAuditSearchQuery,
} from '@/lib/administration/admin-audit-reader';
import { db } from '@/lib/db';

function auditWhere(
  query: AdminAuditSearchQuery,
  matchingActorIds: readonly string[],
): Prisma.AdminAuditEventWhereInput {
  return {
    ...(query.action ? { action: query.action } : {}),
    ...(query.targetType ? { targetType: query.targetType } : {}),
    ...(query.outcome ? { outcome: query.outcome } : {}),
    ...(query.actor
      ? {
          OR: [
            { actorUserId: { contains: query.actor, mode: 'insensitive' as const } },
            ...(matchingActorIds.length > 0
              ? [{ actorUserId: { in: [...matchingActorIds] } }]
              : []),
          ],
        }
      : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };
}

function asReadEvent(
  event: Awaited<ReturnType<typeof db.adminAuditEvent.findMany>>[number],
  actorNames: ReadonlyMap<string, string | null>,
): AdminAuditReadEvent {
  return {
    ...event,
    actorRole: event.actorRole as AdminAuditReadEvent['actorRole'],
    action: event.action as AdminAuditReadEvent['action'],
    targetType: event.targetType as AdminAuditReadEvent['targetType'],
    outcome: event.outcome as AdminAuditReadEvent['outcome'],
    metadata: event.metadata as AdminAuditReadEvent['metadata'],
    actorName: event.actorUserId ? actorNames.get(event.actorUserId) ?? null : null,
  };
}

export const adminAuditReadRepository: AdminAuditReadRepository = {
  async search(query) {
    const matchingActors = query.actor
      ? await db.user.findMany({
          where: {
            OR: [
              { id: { contains: query.actor, mode: 'insensitive' } },
              { name: { contains: query.actor, mode: 'insensitive' } },
              { email: { contains: query.actor, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
          take: 100,
        })
      : [];
    const where = auditWhere(query, matchingActors.map((actor) => actor.id));
    const [total, events] = await Promise.all([
      db.adminAuditEvent.count({ where }),
      db.adminAuditEvent.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    const actorIds = [...new Set(events.flatMap((event) => event.actorUserId ? [event.actorUserId] : []))];
    const actors = actorIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true },
        })
      : [];
    const actorNames = new Map(actors.map((actor) => [actor.id, actor.name]));

    return {
      total,
      events: events.map((event) => asReadEvent(event, actorNames)),
    };
  },
};
