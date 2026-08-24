import 'server-only';

import { PgBoss } from 'pg-boss';

import { db } from '@/lib/db';
import { createJobControlService, type JobControlDatabase } from '@/lib/jobs/control';
import {
  createJobSubmissionService,
  type JobQueuePublisher,
  type JobSubmissionDatabase,
} from '@/lib/jobs/submission';

function databaseUrl(): string {
  const value = process.env.POSTGRESQL_URL;
  if (!value) throw new Error('POSTGRESQL_URL is required for background jobs');
  return value;
}

type SubmissionService = ReturnType<typeof createJobSubmissionService>;
type ControlService = ReturnType<typeof createJobControlService>;

let runtime: { submission: SubmissionService; control: ControlService } | undefined;
let publisher: PgBoss | undefined;
let publisherStart: Promise<PgBoss> | undefined;

async function startedPublisher(): Promise<PgBoss> {
  publisher ??= new PgBoss({
    connectionString: databaseUrl(),
    schema: 'pgboss',
    migrate: false,
    createSchema: false,
    schedule: false,
    supervise: false,
  });

  const current = publisher;
  publisherStart ??= current.start().then(() => current).catch(async (error: unknown) => {
    if (publisher === current) {
      publisher = undefined;
      publisherStart = undefined;
    }
    await current.stop({ graceful: false, timeout: 5_000 }).catch(() => undefined);
    throw error;
  });
  return publisherStart;
}

type RuntimeQueue = JobQueuePublisher & {
  cancel(...args: Parameters<PgBoss['cancel']>): ReturnType<PgBoss['cancel']>;
};

const queuePublisher: RuntimeQueue = {
  async send(name, data, options) {
    return (await startedPublisher()).send(name, data, options);
  },
  async cancel(...args: Parameters<PgBoss['cancel']>) {
    return (await startedPublisher()).cancel(...args);
  },
};

function jobRuntime() {
  if (runtime) return runtime;

  runtime = {
    submission: createJobSubmissionService({
      database: db as unknown as JobSubmissionDatabase,
      publisher: queuePublisher,
    }),
    control: createJobControlService({
      database: db as unknown as JobControlDatabase,
      queue: queuePublisher,
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
