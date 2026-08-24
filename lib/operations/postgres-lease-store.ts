import type { OperationalLeaseStore } from '@/lib/operations/lease';

type OperationalLeaseDatabase = {
  $queryRawUnsafe<T>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
};

type LeaseRow = {
  fencingToken: bigint;
  expiresAt: Date;
};

const ACQUIRE_LEASE = `
  INSERT INTO "OperationalLease" (
    "resourceKey", "ownerTokenHash", "fencingToken", "expiresAt", "createdAt", "updatedAt"
  )
  VALUES ($1, $2, 1, $3, $4, $4)
  ON CONFLICT ("resourceKey") DO UPDATE
  SET
    "ownerTokenHash" = EXCLUDED."ownerTokenHash",
    "fencingToken" = "OperationalLease"."fencingToken" + 1,
    "expiresAt" = EXCLUDED."expiresAt",
    "updatedAt" = EXCLUDED."updatedAt"
  WHERE
    "OperationalLease"."ownerTokenHash" IS NULL
    OR "OperationalLease"."expiresAt" <= $4
  RETURNING "fencingToken", "expiresAt"
`;

const RENEW_LEASE = `
  UPDATE "OperationalLease"
  SET "expiresAt" = $5, "updatedAt" = $4
  WHERE
    "resourceKey" = $1
    AND "ownerTokenHash" = $2
    AND "fencingToken" = $3
    AND "expiresAt" > $4
  RETURNING "fencingToken", "expiresAt"
`;

const CURRENT_LEASE = `
  SELECT EXISTS (
    SELECT 1
    FROM "OperationalLease"
    WHERE
      "resourceKey" = $1
      AND "ownerTokenHash" = $2
      AND "fencingToken" = $3
      AND "expiresAt" > $4
  ) AS "current"
`;

const RELEASE_LEASE = `
  UPDATE "OperationalLease"
  SET "ownerTokenHash" = NULL, "updatedAt" = CURRENT_TIMESTAMP
  WHERE
    "resourceKey" = $1
    AND "ownerTokenHash" = $2
    AND "fencingToken" = $3
`;

export function createPostgresOperationalLeaseStore(
  database: OperationalLeaseDatabase,
): OperationalLeaseStore {
  return {
    async acquire(input) {
      const rows = await database.$queryRawUnsafe<LeaseRow[]>(
        ACQUIRE_LEASE,
        input.resourceKey,
        input.ownerTokenHash,
        input.expiresAt,
        input.now,
      );
      return rows[0] ?? null;
    },
    async renew(input) {
      const rows = await database.$queryRawUnsafe<LeaseRow[]>(
        RENEW_LEASE,
        input.resourceKey,
        input.ownerTokenHash,
        input.fencingToken,
        input.now,
        input.expiresAt,
      );
      return rows[0] ?? null;
    },
    async isCurrent(input) {
      const rows = await database.$queryRawUnsafe<Array<{ current: boolean }>>(
        CURRENT_LEASE,
        input.resourceKey,
        input.ownerTokenHash,
        input.fencingToken,
        input.now,
      );
      return rows[0]?.current === true;
    },
    async release(input) {
      return (await database.$executeRawUnsafe(
        RELEASE_LEASE,
        input.resourceKey,
        input.ownerTokenHash,
        input.fencingToken,
      )) === 1;
    },
  };
}
