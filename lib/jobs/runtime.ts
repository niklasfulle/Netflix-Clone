import 'server-only';

import { PgBoss } from 'pg-boss';

import { db } from '@/lib/db';
import { createJobControlService, type JobControlDatabase } from '@/lib/jobs/control';
import { createJobRetryService, type JobRetryDatabase } from '@/lib/jobs/retry';
import {
  createJobSubmissionService,
  type JobQueuePublisher,
  type JobSubmissionDatabase,
} from '@/lib/jobs/submission';
import {
  createWeeklyScheduleService,
  type WeeklyScheduleStore,
} from '@/lib/jobs/weekly-schedules';

function databaseUrl(): string {
  const value = process.env.POSTGRESQL_URL;
  if (!value) throw new Error('POSTGRESQL_URL is required for background jobs');
  return value;
}

type SubmissionService = ReturnType<typeof createJobSubmissionService>;
type ControlService = ReturnType<typeof createJobControlService>;
type RetryService = ReturnType<typeof createJobRetryService>;
type ScheduleService = ReturnType<typeof createWeeklyScheduleService>;

let runtime: {
  submission: SubmissionService;
  control: ControlService;
  retry: RetryService;
  schedules: ScheduleService;
} | undefined;
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

const scheduleStore: WeeklyScheduleStore = {
  async getSchedules(name, key) {
    return (await startedPublisher()).getSchedules(name, key);
  },
  async schedule(name, cron, data, options) {
    await (await startedPublisher()).schedule(name, cron, data, options);
  },
  async unschedule(name, key) {
    await (await startedPublisher()).unschedule(name, key);
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
    retry: createJobRetryService({
      database: db as unknown as JobRetryDatabase,
      publisher: queuePublisher,
    }),
    schedules: createWeeklyScheduleService(scheduleStore),
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

export const backgroundJobRetry: RetryService = {
  async retry(jobRunId, actor) {
    return jobRuntime().retry.retry(jobRunId, actor);
  },
};

export const weeklyJobSchedules: ScheduleService = {
  async list() {
    return jobRuntime().schedules.list();
  },
  async update(input) {
    return jobRuntime().schedules.update(input);
  },
};
