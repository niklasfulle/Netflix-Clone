import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

if (!process.env.E2E_DATABASE_URL) {
  throw new Error('E2E_DATABASE_URL is required in .env.e2e.local');
}

const directory = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.join(directory, '..');
const database = new PrismaClient({
  datasources: { db: { url: process.env.E2E_DATABASE_URL } },
});
const rows = await database.$queryRawUnsafe('SELECT current_database() AS "databaseName"');
await database.$disconnect();
const databaseName = rows[0]?.databaseName?.trim().toLowerCase() ?? '';
if (!databaseName.includes('stage') && !databaseName.includes('staging')) {
  throw new Error(`Integration tests require an isolated staging database; received '${databaseName || 'unknown'}'.`);
}

const prismaExecutable = path.join(workspace, 'node_modules', 'prisma', 'build', 'index.js');
const environment = {
  ...process.env,
  POSTGRESQL_URL: process.env.E2E_DATABASE_URL,
};
const migration = spawnSync(process.execPath, [prismaExecutable, 'migrate', 'deploy'], {
  cwd: workspace,
  env: environment,
  stdio: 'inherit',
});
if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status ?? 1);

const jestExecutable = path.join(directory, '..', 'node_modules', 'jest', 'bin', 'jest.js');
const result = spawnSync(
  process.execPath,
  [jestExecutable, '--runInBand', 'data/__tests__/media-integrity-persistence.integration.test.ts'],
  {
    cwd: workspace,
    env: { ...environment, RUN_MEDIA_INTEGRITY_DATABASE_INTEGRATION: 'true' },
    stdio: 'inherit',
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
