import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.env.E2E_DATABASE_URL) {
  throw new Error('E2E_DATABASE_URL is required in .env.e2e.local');
}

const directory = path.dirname(fileURLToPath(import.meta.url));
const jestExecutable = path.join(directory, '..', 'node_modules', 'jest', 'bin', 'jest.js');
const result = spawnSync(
  process.execPath,
  [
    jestExecutable,
    '--runInBand',
    'data/__tests__/admin-audit-persistence.integration.test.ts',
  ],
  {
    cwd: path.join(directory, '..'),
    env: {
      ...process.env,
      POSTGRESQL_URL: process.env.E2E_DATABASE_URL,
      RUN_ADMIN_AUDIT_DATABASE_INTEGRATION: 'true',
    },
    stdio: 'inherit',
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
