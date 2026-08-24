/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';

describe('durable background job migration', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
  const migrationPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260823120000_background_job_contracts',
    'migration.sql',
  );

  it('defines durable states, ownership, progress, results, and idempotency', () => {
    expect(schema).toContain('enum JobRunStatus');
    expect(schema).toContain('model JobRun');
    expect(schema).toContain('@@unique([jobType, idempotencyKey])');
    expect(schema).toContain('queueJobId');
    expect(schema).toContain('cancelRequestedAt');
    expect(schema).toContain('result');
  });

  it('creates the durable job table without storing jobs in Redis', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('CREATE TABLE "JobRun"');
    expect(migration).toContain('CREATE UNIQUE INDEX "JobRun_jobType_idempotencyKey_key"');
    expect(migration).not.toMatch(/redis/i);
  });
});
