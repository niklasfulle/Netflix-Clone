import { Prisma } from '@prisma/client';

import type { AuthRateLimitRepository } from '@/lib/authentication/throttle';
import { db } from '@/lib/db';

const CLEANUP_BATCH_SIZE = 25;

function utcTimestamp(date: Date) {
  return Prisma.sql`timezone('UTC', to_timestamp(${date.getTime()} / 1000.0))`;
}

export const authRateLimitRepository: AuthRateLimitRepository = {
  async consume({ scope, subjectType, subjectHash, limit, windowMs, now }) {
    const timestamp = utcTimestamp(now);
    const nextResetAt = utcTimestamp(new Date(now.getTime() + windowMs));
    const rows = await db.$queryRaw<Array<{ attempts: number; resetAt: Date }>>(Prisma.sql`
      INSERT INTO "AuthRateLimit" (
        "scope", "subjectType", "subjectHash", "attempts", "resetAt", "updatedAt"
      )
      VALUES (${scope}, ${subjectType}, ${subjectHash}, 1, ${nextResetAt}, ${timestamp})
      ON CONFLICT ("scope", "subjectType", "subjectHash") DO UPDATE SET
        "attempts" = CASE
          WHEN "AuthRateLimit"."resetAt" <= ${timestamp} THEN 1
          ELSE LEAST("AuthRateLimit"."attempts" + 1, ${limit + 1})
        END,
        "resetAt" = CASE
          WHEN "AuthRateLimit"."resetAt" <= ${timestamp} THEN ${nextResetAt}
          ELSE "AuthRateLimit"."resetAt"
        END,
        "updatedAt" = ${timestamp}
      RETURNING "attempts", "resetAt"
    `);
    const bucket = rows[0];
    if (!bucket) {
      throw new Error('PostgreSQL did not return an authentication rate-limit bucket');
    }
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "AuthRateLimit"
      WHERE ctid IN (
        SELECT ctid
        FROM "AuthRateLimit"
        WHERE "resetAt" <= ${timestamp}
        LIMIT ${CLEANUP_BATCH_SIZE}
      )
    `);
    return bucket;
  },

  async reset({ scope, subjectType, subjectHash }) {
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "AuthRateLimit"
      WHERE "scope" = ${scope}
        AND "subjectType" = ${subjectType}
        AND "subjectHash" = ${subjectHash}
    `);
  },
};
