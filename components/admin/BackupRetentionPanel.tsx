'use client';

import { AlertTriangle, CheckCircle2, DatabaseBackup, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

const endpoint = '/api/admin/backups/retention';
const activeJobStorageKey = 'admin:backup-retention:active-job';

type JobStatusDto = {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCEL_REQUESTED' | 'CANCELLED' | 'DEAD_LETTER';
  progress: number;
  progressMessage: string | null;
  errorMessage: string | null;
};

const terminalStatuses = new Set<JobStatusDto['status']>([
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'DEAD_LETTER',
]);

async function responseJson(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || 'Backup retention cleanup could not be queued.');
  }
  return body;
}

async function jobStatusFetcher(url: string): Promise<JobStatusDto> {
  return responseJson(await fetch(url, { cache: 'no-store' }));
}

function jobMessage(job: JobStatusDto): string {
  if (job.status === 'QUEUED') {
    return 'Retention cleanup queued. Progress is recorded as a background job.';
  }
  if (job.status === 'SUCCEEDED') return 'Retention cleanup completed.';
  if (job.status === 'CANCELLED') return 'Retention cleanup cancelled.';
  if (job.status === 'CANCEL_REQUESTED') return 'Cancellation requested.';
  if (job.status === 'FAILED') return 'Retention cleanup failed.';
  if (job.status === 'DEAD_LETTER') return 'Retention cleanup exhausted its retries.';
  return `${job.progressMessage || 'Retention cleanup in progress'} · ${job.progress}%`;
}

function jobStatusUrl(jobRunId: string | null) {
  return jobRunId ? `/api/admin/jobs/${encodeURIComponent(jobRunId)}` : null;
}

function pollingInterval(latest: JobStatusDto | undefined) {
  return latest && !terminalStatuses.has(latest.status) ? 2_000 : 0;
}

function isActiveJob(jobRunId: string | null, job: JobStatusDto | undefined) {
  return Boolean(jobRunId && (!job || !terminalStatuses.has(job.status)));
}

function isFailedJob(job: JobStatusDto | undefined) {
  return job?.status === 'FAILED' || job?.status === 'DEAD_LETTER';
}

type RetentionJobFeedbackProps = Readonly<{
  active: boolean;
  cancelling: boolean;
  error: string;
  failed: boolean;
  job: JobStatusDto | undefined;
  message: string;
  onCancel: () => void;
}>;

function RetentionJobFeedback({
  active,
  cancelling,
  error,
  failed,
  job,
  message,
  onCancel,
}: RetentionJobFeedbackProps) {
  if (!message && !error) return null;

  return (
    <div className="border-t border-zinc-800 px-5 py-4 sm:px-6">
      {message ? (
        <output className={`flex items-start gap-2 text-sm ${failed ? 'text-red-300' : 'text-emerald-400'}`}>
          {failed
            ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          {message}
        </output>
      ) : null}
      {active && job ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling || job.status === 'CANCEL_REQUESTED'}
          className="mt-3 min-h-10 rounded-lg border border-amber-300/30 px-3 text-sm font-medium text-amber-200 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Cancel retention cleanup'}
        </button>
      ) : null}
      {error ? (
        <div role="alert" className="flex items-start gap-2 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : null}
    </div>
  );
}

export function BackupRetentionPanel() {
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const rememberedJobId = globalThis.sessionStorage.getItem(activeJobStorageKey);
    if (rememberedJobId) setActiveJobId(rememberedJobId);
  }, []);

  const {
    data: activeJob,
    error: activeJobError,
    mutate: mutateActiveJob,
  } = useSWR<JobStatusDto>(
    jobStatusUrl(activeJobId),
    jobStatusFetcher,
    { refreshInterval: pollingInterval },
  );
  const active = isActiveJob(activeJobId, activeJob);

  const requestCleanup = async () => {
    setRequesting(true);
    setMessage('');
    setError('');
    try {
      const idempotencyKey = globalThis.crypto.randomUUID?.() ?? `retention_${Date.now()}`;
      const accepted = await responseJson(await fetch(endpoint, {
        method: 'POST',
        headers: { 'idempotency-key': idempotencyKey },
      }));
      if (typeof accepted?.jobRunId !== 'string') {
        throw new TypeError('Retention cleanup job was not accepted.');
      }
      globalThis.sessionStorage.setItem(activeJobStorageKey, accepted.jobRunId);
      setActiveJobId(accepted.jobRunId);
      setMessage('Retention cleanup queued. Progress is recorded as a background job.');
    } catch (error_) {
      setError(error_ instanceof Error
        ? error_.message
        : 'Backup retention cleanup could not be queued.');
    } finally {
      setRequesting(false);
    }
  };

  const cancelCleanup = async () => {
    if (!activeJobId) return;
    setCancelling(true);
    setError('');
    try {
      const cancelled = await responseJson(await fetch(
        `/api/admin/jobs/${encodeURIComponent(activeJobId)}`,
        { method: 'DELETE' },
      ));
      await mutateActiveJob(cancelled, { revalidate: false });
      setMessage('Retention cleanup cancelled.');
    } catch (error_) {
      setError(error_ instanceof Error
        ? error_.message
        : 'Retention cleanup could not be cancelled.');
    } finally {
      setCancelling(false);
    }
  };

  const visibleError = error || activeJobError?.message || activeJob?.errorMessage || '';
  const visibleMessage = activeJob ? jobMessage(activeJob) : message;
  const jobFailed = isFailedJob(activeJob);

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-900/50">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="shrink-0 rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
            <DatabaseBackup className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-white">Scheduled Backup Retention</h2>
            <p className="mt-1 max-w-3xl text-sm text-zinc-400">
              Applies the server-managed retention policy. Minimum copies and protected backups remain enforced on the host.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={requestCleanup}
          disabled={requesting || active}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50 sm:w-auto"
        >
          {requesting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Run Backup Retention Cleanup
        </button>
      </div>
      <RetentionJobFeedback
        active={active}
        cancelling={cancelling}
        error={visibleError}
        failed={jobFailed}
        job={activeJob}
        message={visibleMessage}
        onCancel={cancelCleanup}
      />
    </section>
  );
}
