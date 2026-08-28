import { z } from 'zod';

export const JOB_NAMES = {
  mediaIntegrityScan: 'media.integrity.scan',
  mediaIntegrityScanDeadLetter: 'media.integrity.scan.dead',
  backupVerification: 'backup.verification.request',
  backupVerificationDeadLetter: 'backup.verification.request.dead',
  backupCreation: 'backup.creation.request',
  backupCreationDeadLetter: 'backup.creation.request.dead',
  backupRetentionCleanup: 'backup.retention.cleanup',
  backupRetentionCleanupDeadLetter: 'backup.retention.cleanup.dead',
  weeklyScheduleTick: 'weekly.schedule.tick',
  weeklyScheduleTickDeadLetter: 'weekly.schedule.tick.dead',
} as const;

export const MAX_JOB_ENVELOPE_BYTES = 8 * 1024;
export const MAX_JOB_AGE_MS = 24 * 60 * 60 * 1_000;

const boundedIdentifier = z.string()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

const contentIdentifier = z.string()
  .min(1)
  .max(191)
  .regex(/^[A-Za-z0-9_-]+$/);

const mediaIntegrityScanFields = {
  name: z.literal(JOB_NAMES.mediaIntegrityScan),
  version: z.literal(1),
  payload: z.discriminatedUnion('scope', [
    z.object({ scope: z.literal('catalog') }).strict(),
    z.object({ scope: z.literal('content'), contentId: contentIdentifier }).strict(),
  ]),
  actor: z.object({
    userId: boundedIdentifier,
    role: z.literal('ADMIN'),
  }).strict(),
  target: z.discriminatedUnion('type', [
    z.object({ type: z.literal('catalog'), id: z.literal('published') }).strict(),
    z.object({ type: z.literal('content'), id: contentIdentifier }).strict(),
  ]),
  idempotencyKey: boundedIdentifier,
  correlationId: boundedIdentifier,
};

function matchingScope(value: {
  payload: { scope: 'catalog' } | { scope: 'content'; contentId: string };
  target: { type: 'catalog'; id: 'published' } | { type: 'content'; id: string };
}): boolean {
  return value.payload.scope === 'catalog'
    ? value.target.type === 'catalog'
    : value.target.type === 'content' && value.target.id === value.payload.contentId;
}

const mediaIntegrityScanSubmission = z.object(mediaIntegrityScanFields).strict().refine(matchingScope, {
  message: 'Job target does not match its payload scope',
});

const backupVerificationFields = {
  name: z.literal(JOB_NAMES.backupVerification),
  version: z.literal(1),
  payload: z.object({
    scope: z.literal('latest'),
    requestId: z.uuid(),
    requestedAt: z.iso.datetime({ offset: true }),
  }).strict(),
  actor: z.object({
    userId: boundedIdentifier,
    role: z.literal('ADMIN'),
  }).strict(),
  target: z.object({
    type: z.literal('backup'),
    id: z.literal('latest'),
  }).strict(),
  idempotencyKey: boundedIdentifier,
  correlationId: boundedIdentifier,
};

const backupVerificationSubmission = z.object(backupVerificationFields).strict();
const backupCreationFields = {
  name: z.literal(JOB_NAMES.backupCreation),
  version: z.literal(1),
  payload: z.object({
    scope: z.literal('scheduled'),
    environment: z.enum(['staging', 'production']),
    requestId: z.uuid(),
    requestedAt: z.iso.datetime({ offset: true }),
  }).strict(),
  actor: z.object({
    userId: boundedIdentifier,
    role: z.literal('ADMIN'),
  }).strict(),
  target: z.object({
    type: z.literal('backup'),
    id: z.enum(['staging', 'production']),
  }).strict(),
  idempotencyKey: boundedIdentifier,
  correlationId: boundedIdentifier,
};

function matchingBackupEnvironment(value: {
  payload: { environment: 'staging' | 'production' };
  target: { id: 'staging' | 'production' };
}): boolean {
  return value.payload.environment === value.target.id;
}

const backupCreationSubmission = z.object(backupCreationFields).strict()
  .refine(matchingBackupEnvironment, {
    message: 'Backup target does not match its environment',
  });
const backupRetentionFields = {
  name: z.literal(JOB_NAMES.backupRetentionCleanup),
  version: z.literal(1),
  payload: z.object({
    scope: z.literal('scheduled'),
    environment: z.enum(['staging', 'production']),
    requestId: z.uuid(),
    requestedAt: z.iso.datetime({ offset: true }),
  }).strict(),
  actor: z.object({
    userId: boundedIdentifier,
    role: z.literal('ADMIN'),
  }).strict(),
  target: z.object({
    type: z.literal('backup_retention'),
    id: z.enum(['staging', 'production']),
  }).strict(),
  idempotencyKey: boundedIdentifier,
  correlationId: boundedIdentifier,
};

function matchingRetentionEnvironment(value: {
  payload: { environment: 'staging' | 'production' };
  target: { id: 'staging' | 'production' };
}): boolean {
  return value.payload.environment === value.target.id;
}

const backupRetentionSubmission = z.object(backupRetentionFields).strict()
  .refine(matchingRetentionEnvironment, {
    message: 'Backup retention target does not match its environment',
  });
const jobSubmission = z.union([
  mediaIntegrityScanSubmission,
  backupVerificationSubmission,
  backupCreationSubmission,
  backupRetentionSubmission,
]);

export type JobSubmission = z.infer<typeof jobSubmission>;

const queuedJob = z.object({
  ...mediaIntegrityScanFields,
  jobRunId: boundedIdentifier,
  acceptedAt: z.iso.datetime({ offset: true }),
}).strict().refine(matchingScope, {
  message: 'Job target does not match its payload scope',
});

const queuedBackupVerificationJob = z.object({
  ...backupVerificationFields,
  jobRunId: boundedIdentifier,
  acceptedAt: z.iso.datetime({ offset: true }),
}).strict();

const queuedBackupCreationJob = z.object({
  ...backupCreationFields,
  jobRunId: boundedIdentifier,
  acceptedAt: z.iso.datetime({ offset: true }),
}).strict().refine(matchingBackupEnvironment, {
  message: 'Backup target does not match its environment',
});

const queuedBackupRetentionJob = z.object({
  ...backupRetentionFields,
  jobRunId: boundedIdentifier,
  acceptedAt: z.iso.datetime({ offset: true }),
}).strict().refine(matchingRetentionEnvironment, {
  message: 'Backup retention target does not match its environment',
});

const queuedJobs = z.union([
  queuedJob,
  queuedBackupVerificationJob,
  queuedBackupCreationJob,
  queuedBackupRetentionJob,
]);

const mediaIntegrityScanResult = z.object({
  scanRunId: boundedIdentifier,
  contentCount: z.number().int().nonnegative().max(1_000_000),
  findingCount: z.number().int().nonnegative().max(1_000_000),
  criticalCount: z.number().int().nonnegative().max(1_000_000),
  warningCount: z.number().int().nonnegative().max(1_000_000),
}).strict();

const backupVerificationResult = z.object({
  verificationRequestId: z.uuid(),
  status: z.literal('VERIFIED'),
  diagnosticCode: z.literal('VERIFICATION_SUCCEEDED'),
  backupName: z.string()
    .min(6)
    .max(191)
    .regex(/^[0-9A-Za-z][0-9A-Za-z._-]*\.dump$/),
}).strict();

const backupCreationResult = z.object({
  backupRequestId: z.uuid(),
  status: z.literal('VERIFIED'),
  environment: z.enum(['staging', 'production']),
  backupName: z.string()
    .min(6)
    .max(191)
    .regex(/^[0-9A-Za-z][0-9A-Za-z._-]*\.dump$/),
}).strict();

const backupRetentionResult = z.object({
  cleanupRequestId: z.uuid(),
  status: z.literal('COMPLETED'),
  environment: z.enum(['staging', 'production']),
  retainedCount: z.number().int().nonnegative().max(1_000_000),
  removedCount: z.number().int().nonnegative().max(1_000_000),
}).strict();

const jobResult = z.union([
  mediaIntegrityScanResult,
  backupVerificationResult,
  backupCreationResult,
  backupRetentionResult,
]);

const jobProgress = z.object({
  percent: z.number().int().min(0).max(100),
  message: z.string().trim().min(1).max(160),
}).strict();

export type QueuedJob = z.infer<typeof queuedJobs>;
export type JobResult = z.infer<typeof jobResult>;
export type JobProgress = z.infer<typeof jobProgress>;

export function parseJobSubmission(value: unknown): JobSubmission {
  return jobSubmission.parse(value);
}

function assertBoundedJson(value: unknown): void {
  const encoded = JSON.stringify(value);
  if (encoded === undefined || Buffer.byteLength(encoded, 'utf8') > MAX_JOB_ENVELOPE_BYTES) {
    throw new Error('Job envelope exceeds the allowed size');
  }
}

export function parseQueuedJob(value: unknown, now = new Date()): QueuedJob {
  assertBoundedJson(value);
  const parsed = queuedJobs.parse(value);
  const acceptedAt = new Date(parsed.acceptedAt).getTime();
  if (acceptedAt > now.getTime() + 60_000 || now.getTime() - acceptedAt > MAX_JOB_AGE_MS) {
    throw new Error('Job envelope is stale');
  }
  return parsed;
}

export function parseJobResult(value: unknown): JobResult {
  return jobResult.parse(value);
}

export function parseJobProgress(value: unknown): JobProgress {
  return jobProgress.parse(value);
}
