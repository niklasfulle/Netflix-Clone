const TERMINAL_JOB_RETENTION_MS = 30 * 24 * 60 * 60_000;
const RETENTION_BATCH_SIZE = 100;

export interface JobRunRetentionDatabase {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
}

const removeExpiredJobRuns = `
  DELETE FROM "JobRun"
  WHERE "id" IN (
    SELECT "id"
    FROM "JobRun"
    WHERE "status" IN ('SUCCEEDED', 'FAILED', 'CANCELLED', 'DEAD_LETTER')
      AND COALESCE("completedAt", "updatedAt") < $1
    ORDER BY COALESCE("completedAt", "updatedAt") ASC
    LIMIT $2
  )
`;

export function createJobRunRetention({
  database,
  now = () => new Date(),
}: {
  database: JobRunRetentionDatabase;
  now?: () => Date;
}) {
  return {
    removeExpired(): Promise<number> {
      const cutoff = new Date(now().getTime() - TERMINAL_JOB_RETENTION_MS);
      return database.$executeRawUnsafe(
        removeExpiredJobRuns,
        cutoff,
        RETENTION_BATCH_SIZE,
      );
    },
  };
}
