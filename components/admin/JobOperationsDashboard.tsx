'use client';

import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';

import { useLanguage } from '@/components/providers/LanguageProvider';
import type { Locale, TranslationKey } from '@/lib/i18n/translations';

const statuses = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCEL_REQUESTED',
  'CANCELLED',
  'DEAD_LETTER',
] as const;

const jobTypes = [
  'media.integrity.scan',
  'backup.verification.request',
  'backup.retention.cleanup',
] as const;

type JobStatus = typeof statuses[number];
type Translator = (key: TranslationKey) => string;

type JobItem = {
  id: string;
  jobType: string;
  status: JobStatus;
  progress: number;
  progressMessage: string | null;
  attemptCount: number;
  actor: { userId: string; role: string };
  target: { type: string; id: string };
  correlationId: string;
  failure: { code: string; message: string } | null;
  acceptedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelRequestedAt: string | null;
  updatedAt: string;
};

type DashboardResponse = {
  items: JobItem[];
  nextCursor: string | null;
  health: {
    worker: {
      status: string;
      state: string;
      heartbeatAt: string | null;
      heartbeatAgeMs: number | null;
    };
    queue: {
      depth: number;
      oldestQueuedAt: string | null;
      oldestQueuedAgeMs: number | null;
    };
    counts: Record<JobStatus, number>;
    observedAt: string;
  };
};

async function responseJson(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'Job operations are currently unavailable.');
  return body;
}

async function dashboardFetcher(url: string): Promise<DashboardResponse> {
  return responseJson(await fetch(url, { cache: 'no-store' }));
}

function dashboardUrl(status: string, jobType: string, cursor: string | null) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (jobType) query.set('jobType', jobType);
  if (cursor) query.set('cursor', cursor);
  query.set('limit', '20');
  return `/api/admin/jobs?${query.toString()}`;
}

function formatDuration(milliseconds: number | null, t: Translator) {
  if (milliseconds === null) return t('None');
  if (milliseconds < 60_000) return `${Math.round(milliseconds / 1_000)} ${t('sec')}`;
  if (milliseconds < 3_600_000) return `${Math.round(milliseconds / 60_000)} ${t('min')}`;
  return `${Math.round(milliseconds / 3_600_000)} ${t('hr')}`;
}

function formatTimestamp(value: string | null, locale: Locale, t: Translator) {
  if (!value) return t('Not recorded');
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function jobStatusLabel(status: JobStatus, t: Translator) {
  const labels: Record<JobStatus, TranslationKey> = {
    QUEUED: 'Queued',
    RUNNING: 'Running',
    SUCCEEDED: 'Succeeded',
    FAILED: 'Failed',
    CANCEL_REQUESTED: 'Cancellation requested',
    CANCELLED: 'Cancelled',
    DEAD_LETTER: 'Dead letter',
  };
  return t(labels[status]);
}

function runtimeLabel(value: string, t: Translator) {
  const labels: Partial<Record<string, TranslationKey>> = {
    healthy: 'healthy',
    unavailable: 'unavailable',
    ACTIVE: 'ACTIVE',
    DEGRADED: 'DEGRADED',
    STOPPING: 'STOPPING',
  };
  const key = labels[value];
  return key ? t(key) : value;
}

function progressMessageLabel(value: string | null, t: Translator) {
  if (!value) return t('No progress message');
  const labels: Partial<Record<string, TranslationKey>> = {
    'Scanning media': 'Scanning media',
    'Removing expired backups': 'Removing expired backups',
    'Restoring backup': 'Restoring backup',
    'Retry queued': 'Retry queued',
    Cancelled: 'Cancelled',
  };
  const key = labels[value];
  return key ? t(key) : value;
}

function domainLink(job: JobItem) {
  return job.jobType.startsWith('backup.')
    ? '/admin/backups'
    : '/admin/media-health';
}

const badgeClass: Record<JobStatus, string> = {
  QUEUED: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  RUNNING: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  SUCCEEDED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  FAILED: 'border-red-500/30 bg-red-500/10 text-red-300',
  CANCEL_REQUESTED: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  CANCELLED: 'border-zinc-600 bg-zinc-800 text-zinc-300',
  DEAD_LETTER: 'border-red-500/40 bg-red-950/40 text-red-200',
};

function HealthSummary({ data, locale, t }: Readonly<{
  data: DashboardResponse['health'];
  locale: Locale;
  t: Translator;
}>) {
  const healthy = data.worker.status === 'healthy';
  return (
    <section aria-label={t('Job runtime health')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className={`rounded-2xl border p-4 ${healthy
        ? 'border-emerald-500/30 bg-emerald-500/10'
        : 'border-amber-500/30 bg-amber-500/10'}`}
      >
        <div className="flex items-center gap-2">
          {healthy
            ? <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden="true" />
            : <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden="true" />}
          <p className="font-semibold text-zinc-100">
            {t('Worker')} {runtimeLabel(data.worker.status, t)}
          </p>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          {runtimeLabel(data.worker.state, t)} · {t('Heartbeat age')}: {formatDuration(data.worker.heartbeatAgeMs, t)}
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{t('Queue depth')}</p>
        <p className="mt-2 text-xl font-semibold text-white">{data.queue.depth} {t('active jobs')}</p>
        <p className="mt-1 text-xs text-zinc-400">
          {t('Oldest queued')}: {formatDuration(data.queue.oldestQueuedAgeMs, t)}
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{t('Failures')}</p>
        <p className="mt-2 text-xl font-semibold text-white">
          {data.counts.FAILED + data.counts.DEAD_LETTER}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{t('Failed and dead-letter jobs')}</p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{t('Completed')}</p>
        <p className="mt-2 text-xl font-semibold text-white">{data.counts.SUCCEEDED}</p>
        <p className="mt-1 text-xs text-zinc-400">{t('Observed')} {formatTimestamp(data.observedAt, locale, t)}</p>
      </div>
    </section>
  );
}

type JobCardProps = Readonly<{
  job: JobItem;
  pendingAction: string | null;
  onAction: (job: JobItem, method: 'DELETE' | 'POST') => void;
  locale: Locale;
  t: Translator;
}>;

function JobCard({ job, pendingAction, onAction, locale, t }: JobCardProps) {
  const pending = pendingAction === job.id;
  const cancellable = job.status === 'QUEUED' || job.status === 'RUNNING';
  const retryable = job.status === 'FAILED' || job.status === 'DEAD_LETTER';
  return (
    <article className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass[job.status]}`}>
              {jobStatusLabel(job.status, t)}
            </span>
            <code className="break-all text-xs text-zinc-500">{job.id}</code>
          </div>
          <h2 className="mt-3 break-words text-base font-semibold text-zinc-100">{job.jobType}</h2>
          <p className="mt-1 text-sm text-zinc-400">{progressMessageLabel(job.progressMessage, t)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {retryable ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onAction(job, 'POST')}
              aria-label={`${t('Retry job')} ${job.id}`}
              className="min-h-10 rounded-lg border border-red-400/30 px-3 text-sm font-medium text-red-200 hover:bg-red-400/10 disabled:opacity-50"
            >
              {pending ? t('Retrying…') : t('Retry')}
            </button>
          ) : null}
          {cancellable ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onAction(job, 'DELETE')}
              aria-label={`${t('Cancel job')} ${job.id}`}
              className="min-h-10 rounded-lg border border-zinc-600 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              {pending ? t('Cancelling…') : t('Cancel')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>{t('Progress')}</span><span>{job.progress}%</span>
        </div>
        <progress
          aria-label={`${t('Progress for job')} ${job.id}`}
          className="h-2 w-full accent-red-500"
          max={100}
          value={job.progress}
        />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div><dt className="text-xs text-zinc-500">{t('Actor')}</dt><dd className="break-all text-zinc-200">{job.actor.userId}</dd></div>
        <div><dt className="text-xs text-zinc-500">{t('Target')}</dt><dd className="break-all text-zinc-200">{job.target.type}:{job.target.id}</dd></div>
        <div><dt className="text-xs text-zinc-500">{t('Attempts')}</dt><dd className="text-zinc-200">{job.attemptCount}</dd></div>
        <div><dt className="text-xs text-zinc-500">{t('Accepted')}</dt><dd className="text-zinc-200">{formatTimestamp(job.acceptedAt, locale, t)}</dd></div>
      </dl>

      {job.failure ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm">
          <p className="font-mono text-xs text-red-300">{job.failure.code}</p>
          <p className="mt-1 text-zinc-400">{job.failure.message}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link
          href={`/admin/audit?correlationId=${encodeURIComponent(job.correlationId)}`}
          className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
        >
          {t('Open audit event')} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Link href={domainLink(job)} className="inline-flex items-center gap-1 text-zinc-300 hover:text-white">
          {t('Open operation result')} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function JobOperationsDashboard() {
  const { locale, t } = useLanguage();
  const [status, setStatus] = useState('');
  const [jobType, setJobType] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<string | null>>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const endpoint = dashboardUrl(status, jobType, cursor);
  const { data, error, isLoading, mutate } = useSWR(endpoint, dashboardFetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });

  function resetPagination() {
    setCursor(null);
    setHistory([]);
  }

  async function performAction(job: JobItem, method: 'DELETE' | 'POST') {
    setPendingAction(job.id);
    setActionError('');
    try {
      await responseJson(await fetch(`/api/admin/jobs/${encodeURIComponent(job.id)}`, { method }));
      await mutate();
    } catch (error_) {
      setActionError(error_ instanceof Error ? error_.message : 'Job action failed.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-5">
      {data ? <HealthSummary data={data.health} locale={locale} t={t} /> : null}

      <section aria-label={t('Job filters')} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:max-w-3xl">
          <label className="text-sm text-zinc-300">
            <span className="mb-1 block text-xs text-zinc-500">{t('Job status')}</span>
            <select
              aria-label={t('Job status')}
              value={status}
              onChange={(event) => { setStatus(event.target.value); resetPagination(); }}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100"
            >
              <option value="">{t('All statuses')}</option>
              {statuses.map((value) => <option key={value} value={value}>{jobStatusLabel(value, t)}</option>)}
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            <span className="mb-1 block text-xs text-zinc-500">{t('Job type')}</span>
            <select
              aria-label={t('Job type')}
              value={jobType}
              onChange={(event) => { setJobType(event.target.value); resetPagination(); }}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100"
            >
              <option value="">{t('All job types')}</option>
              {jobTypes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </section>

      {isLoading ? (
        <output className="flex items-center gap-2 rounded-xl border border-zinc-800 p-5 text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {t('Loading background jobs…')}
        </output>
      ) : null}
      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {error.message}
        </div>
      ) : null}
      {actionError ? <div role="alert" className="text-sm text-red-300">{actionError}</div> : null}
      {data?.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-400">
          {t('No background jobs match these filters.')}
        </div>
      ) : null}
      <div className="grid gap-4">
        {data?.items.map((job) => (
          <JobCard key={job.id} job={job} pendingAction={pendingAction} onAction={performAction} locale={locale} t={t} />
        ))}
      </div>

      {data ? (
        <nav aria-label={t('Job pages')} className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          <button
            type="button"
            disabled={history.length === 0}
            onClick={() => {
              const previous = history.at(-1) ?? null;
              setHistory((values) => values.slice(0, -1));
              setCursor(previous);
            }}
            className="min-h-10 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-200 disabled:opacity-40"
          >
            {t('Previous')}
          </button>
          <button
            type="button"
            onClick={() => void mutate()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-200"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> {t('Refresh')}
          </button>
          <button
            type="button"
            disabled={!data.nextCursor}
            onClick={() => {
              setHistory((values) => [...values, cursor]);
              setCursor(data.nextCursor);
            }}
            className="min-h-10 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-200 disabled:opacity-40"
          >
            {t('Next')}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
