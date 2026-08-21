import { Prisma } from '@prisma/client';

import type { AdminAuditRepository } from '@/lib/administration/admin-audit';
import { db } from '@/lib/db';

export const adminAuditRepository: AdminAuditRepository = {
  async append(event) {
    await db.adminAuditEvent.create({
      data: {
        ...event,
        metadata: event.metadata ?? Prisma.JsonNull,
      },
    });
  },

  async removeBefore(cutoff, limit) {
    return db.$executeRaw(Prisma.sql`
      DELETE FROM "AdminAuditEvent"
      WHERE ctid IN (
        SELECT ctid
        FROM "AdminAuditEvent"
        WHERE "createdAt" < ${cutoff}
        ORDER BY "createdAt" ASC
        LIMIT ${limit}
      )
    `);
  },
};
