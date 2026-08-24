import 'server-only';

import { PgBoss } from 'pg-boss';

import { db } from '@/lib/db';
import { createJobControlService, type JobControlDatabase } from '@/lib/jobs/control';
import { createJobSubmissionService, type JobSubmissionDatabase } from '@/lib/jobs/submission';

function databaseUrl(): string {
  const value = process.env.POSTGRESQL_URL;
  if (!value) throw new Error('POSTGRESQL_URL is required for background jobs');
  return value;
}

type SubmissionService = ReturnType<typeof createJobSubmissionService>;
type ControlService = ReturnType<typeof createJobControlService>;

let runtime: { submission: SubmissionService; control: ControlService } | undefined;

function jobRuntime() {
  if (runtime) return runtime;

  const publisher = new PgBoss({
    connectionString: databaseUrl(),
    schema: 'pgboss',
    migrate: false,
    createSchema: false,
    schedule: false,
    supervise: false,
  });
  runtime = {
    submission: createJobSubmissionService({
      database: db as unknown as JobSubmissionDatabase,
      publisher,
    }),
    control: createJobControlService({
      database: db as unknown as JobControlDatabase,
      queue: publisher,
    }),
  };
  return runtime;
}

export const backgroundJobSubmission: SubmissionService = {
  async submit(value) {
    return jobRuntime().submission.submit(value);
  },
};

export const backgroundJobControl: ControlService = {
  async get(jobRunId, actor) {
    return jobRuntime().control.get(jobRunId, actor);
  },
  async cancel(jobRunId, actor) {
    return jobRuntime().control.cancel(jobRunId, actor);
  },
};
