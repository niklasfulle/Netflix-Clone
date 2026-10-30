import { backendLogStore } from '@/lib/log-store';
import { JOB_NAMES } from './contracts';
import { jobFailureDetails, jobFailureMessage } from './failure-diagnostics';

function identifier(value: unknown): string | undefined {
  return typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,191}$/.test(value) ? value : undefined;
}

export async function reportBackgroundJobFailure(input: {
  envelope: unknown; queueJobId: string; attemptCount: number; deadLetter: boolean; error: unknown;
}) {
  const envelope: { jobRunId?: unknown; correlationId?: unknown; name?: unknown } = input.envelope && typeof input.envelope === 'object'
    ? input.envelope as { jobRunId?: unknown; correlationId?: unknown; name?: unknown } : {};
  const { errorCode } = jobFailureDetails(input.error);
  const diagnostic = jobFailureMessage(errorCode) || /^[A-Za-z]{1,60}Error$/.test(errorCode) || errorCode === 'Error'
    ? errorCode : 'UnknownError';
  const entry = {
    timestamp: new Date().toISOString(), level: 'error', action: 'background_job_failed',
    queueJobId: identifier(input.queueJobId), jobRunId: identifier(envelope.jobRunId),
    correlationId: identifier(envelope.correlationId),
    jobType: Object.values(JOB_NAMES).includes(envelope.name as typeof JOB_NAMES[keyof typeof JOB_NAMES]) ? envelope.name : undefined,
    attemptCount: input.attemptCount, deadLetter: input.deadLetter, diagnostic,
    message: jobFailureMessage(diagnostic) ?? 'Background operation failed. Review server logs using the correlation ID.',
  };
  // Keep a useful fallback even if the shared log volume itself is unwritable.
  console.error('background_job_failed', entry);
  try { await backendLogStore.write(entry); }
  catch { console.error('background_job_log_write_failed', { queueJobId: entry.queueJobId, correlationId: entry.correlationId }); }
}
