import { db } from '@/lib/db';

export async function assertIsolatedStagingDatabase() {
  const rows = await db.$queryRaw<Array<{ databaseName: string }>>`
    SELECT current_database() AS "databaseName"
  `;
  const databaseName = rows[0]?.databaseName?.trim().toLowerCase() ?? '';
  if (!databaseName.includes('stage') && !databaseName.includes('staging')) {
    throw new Error(
      `Integration tests require an isolated staging database; received '${databaseName || 'unknown'}'.`,
    );
  }
}
