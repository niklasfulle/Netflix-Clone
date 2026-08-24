import { z } from 'zod';

export const JOB_NAMES = {
  mediaIntegrityScan: 'media.integrity.scan',
  mediaIntegrityScanDeadLetter: 'media.integrity.scan.dead',
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

export type JobSubmission = z.infer<typeof mediaIntegrityScanSubmission>;

const queuedJob = z.object({
  ...mediaIntegrityScanFields,
  jobRunId: boundedIdentifier,
  acceptedAt: z.iso.datetime({ offset: true }),
}).strict().refine(matchingScope, {
  message: 'Job target does not match its payload scope',
});

const mediaIntegrityScanResult = z.object({
  scanRunId: boundedIdentifier,
  contentCount: z.number().int().nonnegative().max(1_000_000),
  findingCount: z.number().int().nonnegative().max(1_000_000),
  criticalCount: z.number().int().nonnegative().max(1_000_000),
  warningCount: z.number().int().nonnegative().max(1_000_000),
}).strict();

const jobProgress = z.object({
  percent: z.number().int().min(0).max(100),
  message: z.string().trim().min(1).max(160),
}).strict();

export type QueuedJob = z.infer<typeof queuedJob>;
export type JobResult = z.infer<typeof mediaIntegrityScanResult>;
export type JobProgress = z.infer<typeof jobProgress>;

export function parseJobSubmission(value: unknown): JobSubmission {
  return mediaIntegrityScanSubmission.parse(value);
}

function assertBoundedJson(value: unknown): void {
  const encoded = JSON.stringify(value);
  if (encoded === undefined || Buffer.byteLength(encoded, 'utf8') > MAX_JOB_ENVELOPE_BYTES) {
    throw new Error('Job envelope exceeds the allowed size');
  }
}

export function parseQueuedJob(value: unknown, now = new Date()): QueuedJob {
  assertBoundedJson(value);
  const parsed = queuedJob.parse(value);
  const acceptedAt = new Date(parsed.acceptedAt).getTime();
  if (acceptedAt > now.getTime() + 60_000 || now.getTime() - acceptedAt > MAX_JOB_AGE_MS) {
    throw new Error('Job envelope is stale');
  }
  return parsed;
}

export function parseJobResult(value: unknown): JobResult {
  return mediaIntegrityScanResult.parse(value);
}

export function parseJobProgress(value: unknown): JobProgress {
  return jobProgress.parse(value);
}
