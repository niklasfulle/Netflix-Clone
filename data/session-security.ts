import { Prisma } from '@prisma/client';

import type { SessionSecurityRepository } from '@/lib/authentication/session-security';
import { db } from '@/lib/db';

const TOUCH_INTERVAL_MS = 15 * 60_000;

export const sessionSecurityRepository: SessionSecurityRepository = {
  async create(session) {
    await db.authSession.create({ data: session });
  },

  async findActive(sessionId, userId, now) {
    return (await db.authSession.count({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    })) === 1;
  },

  async getLegacyCutoff(userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { sessionsInvalidBefore: true },
    });
    return user?.sessionsInvalidBefore ?? null;
  },

  async touch(sessionId, now) {
    await db.authSession.updateMany({
      where: {
        id: sessionId,
        lastSeenAt: { lte: new Date(now.getTime() - TOUCH_INTERVAL_MS) },
      },
      data: { lastSeenAt: now },
    });
  },

  async revokeAll(userId, now) {
    const result = await db.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
    return result.count;
  },

  async revokeOne(userId, sessionId, now) {
    const result = await db.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: now },
    });
    return result.count === 1;
  },

  async revokeOthers(userId, currentSessionId, now) {
    const result = await db.authSession.updateMany({
      where: {
        userId,
        id: { not: currentSessionId },
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
    return result.count;
  },

  async setLegacyCutoff(userId, now) {
    await db.user.update({
      where: { id: userId },
      data: { sessionsInvalidBefore: now },
    });
  },

  async recordActivity(activity) {
    await db.securityActivity.create({
      data: {
        ...activity,
        details: activity.details ?? Prisma.JsonNull,
      },
    });
  },

  async listActivity(userId, limit) {
    return db.securityActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        event: true,
        createdAt: true,
        userAgent: true,
      },
    }) as ReturnType<SessionSecurityRepository['listActivity']>;
  },

  async removeActivityBefore(cutoff, limit) {
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "SecurityActivity"
      WHERE ctid IN (
        SELECT ctid
        FROM "SecurityActivity"
        WHERE "createdAt" < ${cutoff}
        LIMIT ${limit}
      )
    `);
  },
};
