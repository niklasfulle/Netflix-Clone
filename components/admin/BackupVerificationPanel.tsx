'use client';

import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { useLanguage } from '@/components/providers/LanguageProvider';
import type {
  BackupVerificationStatus,
  BackupVerificationStatusName,
  ScheduledBackupStatus,
} from '@/lib/backup-verification';
import type { Locale, TranslationKey } from '@/lib/i18n/translations';

const endpoint = '/api/admin/backups/verification';
const activeJobStorageKey = 'admin:backup-verification:active-job';
type Translator = (key: TranslationKey) => string;

type JobStatusDto = {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCEL_REQUESTED' | 'CANCELLED' | 'DEAD_LETTER';
  progress: number;
  progressMessage: string | null;
  errorMessage: string | null;
};

const terminalJobStatuses = new Set<JobStatusDto['status']>([
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'DEAD_LETTER',
]);

const statusPresentation: Record<BackupVerificationStatusName, {
  label: TranslationKey;
  className: string;
}> = {
  PENDING: { label: 'Pending', className: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  RUNNING: { label: 'Running', className: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  VERIFIED: { label: 'Verified', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  CORRUPT: { label: 'Corrupt', className: 'border-red-500/30 bg-red-500/10 text-red-300' },
  TRUNCATED: { label: 'Truncated', className: 'border-red-500/30 bg-red-500/10 text-red-300' },
  INCOMPATIBLE: { label: 'Incompatible', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  TIMEOUT: { label: 'Timed Out', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  FAILED: { label: 'Failed', className: 'border-red-500/30 bg-red-500/10 text-red-300' },
  INTERRUPTED: { label: 'Interrupted', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  BUSY: { label: 'Busy', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
};

async function responseJson(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || 'Backup verification is currently unavailable.');
  }
  return body;
}

async function verificationFetcher(): Promise<{
  status: BackupVerificationStatus | null;
  scheduled: ScheduledBackupStatus | null;
}> {
  return responseJson(await fetch(endpoint, { cache: 'no-store' }));
}

async function jobStatusFetcher(url: string): Promise<JobStatusDto> {
  return responseJson(await fetch(url, { cache: 'no-store' }));
}

function localizedProgressMessage(message: string | null, t: Translator) {
  if (!message) return t('Backup verification in progress');
  const labels: Partial<Record<string, TranslationKey>> = {
    'Restoring backup': 'Restoring backup',
    Cancelled: 'Cancelled',
  };
  const key = labels[message];
  return key ? t(key) : message;
}

function jobMessage(job: JobStatusDto, t: Translator): string {
  if (job.status === 'QUEUED') return t('Backup verification queued.');
  if (job.status === 'SUCCEEDED') return t('Backup verification completed.');
  if (job.status === 'CANCELLED') return t('Backup verification cancelled.');
  if (job.status === 'CANCEL_REQUESTED') return t('Cancellation requested.');
  if (job.status === 'FAILED') return t('Backup verification failed.');
  if (job.status === 'DEAD_LETTER') return t('Backup verification exhausted its retries.');
  return `${localizedProgressMessage(job.progressMessage, t)} · ${job.progress}%`;
}

function jobStatusUrl(jobRunId: string | null) {
  return jobRunId ? `/api/admin/jobs/${encodeURIComponent(jobRunId)}` : null;
}

function jobPollingInterval(latest: JobStatusDto | undefined) {
  return latest && !terminalJobStatuses.has(latest.status) ? 2_000 : 0;
}

function verificationPollingInterval(latest: {
  status: BackupVerificationStatus | null;
} | undefined) {
  const state = latest?.status?.status;
  return state === 'PENDING' || state === 'RUNNING' ? 3_000 : 0;
}

function isActiveJob(jobRunId: string | null, job: JobStatusDto | undefined) {
  return Boolean(jobRunId && (!job || !terminalJobStatuses.has(job.status)));
}

function isFailedJob(job: JobStatusDto | undefined) {
  return job?.status === 'FAILED' || job?.status === 'DEAD_LETTER';
}

function ScheduledBackupEvidence({ status, locale, t }: Readonly<{
  status: ScheduledBackupStatus;
  locale: Locale;
  t: Translator;
}>) {
  const labels = { RUNNING: t('Running'), VERIFIED: t('Verified'), FAILED: t('Failed') } as const;
  const healthy = status.status === 'VERIFIED';
  return (
    <div className={`rounded-xl border p-4 ${healthy
      ? 'border-emerald-500/30 bg-emerald-500/10'
      : 'border-amber-500/30 bg-amber-500/10'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-100">
          {t('Scheduled backup')}: {labels[status.status]}
        </p>
        <span className="text-xs uppercase tracking-wide text-zinc-400">{status.environment}</span>
      </div>
      <p className="mt-2 break-all font-mono text-xs text-zinc-300">
        {status.backupName ?? t('No completed scheduled backup')}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {status.diagnosticCode} · {formatTimestamp(status.completedAt, locale, t)}
      </p>
    </div>
  );
}

function formatBytes(bytes: number | null, t: Translator) {
  if (bytes === null) return t('Unknown size');
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(value: string | null, locale: Locale, t: Translator) {
  if (!value) return t('Not completed');
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function RecoveryEvidence({ status, locale, t }: Readonly<{
  status: BackupVerificationStatus;
  locale: Locale;
  t: Translator;
}>) {
  const presentation = statusPresentation[status.status];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${presentation.className}`}>
          {t(presentation.label)}
        </span>
        <span className="font-mono text-sm text-zinc-300">{status.backupName || t('Latest host backup')}</span>
        <span className="text-xs text-zinc-500">{formatBytes(status.sizeBytes, t)}</span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <dt className="text-xs text-zinc-500">{t('Source')}</dt>
          <dd className="mt-1 font-medium text-zinc-200">
            {status.sourcePostgresVersion ? `PostgreSQL ${status.sourcePostgresVersion}` : t('Unknown')}
          </dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <dt className="text-xs text-zinc-500">{t('Restore verifier')}</dt>
          <dd className="mt-1 font-medium text-zinc-200">
            {status.verificationPostgresVersion
              ? `PostgreSQL ${status.verificationPostgresVersion}`
              : t('Unknown')}
          </dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <dt className="text-xs text-zinc-500">{t('Completed')}</dt>
          <dd className="mt-1 font-medium text-zinc-200">{formatTimestamp(status.completedAt, locale, t)}</dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <dt className="text-xs text-zinc-500">{t('Diagnostic code')}</dt>
          <dd className="mt-1 break-words font-mono text-xs text-zinc-300">{status.diagnosticCode}</dd>
        </div>
      </dl>

      {status.checks ? (
        <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1.5">{status.checks.publicTableCount} {t('tables')}</span>
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1.5">{status.checks.migrationCount} {t('migrations')}</span>
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1.5">{status.checks.userCount} {t('users')}</span>
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1.5">{status.checks.contentCount} {t('content records')}</span>
        </div>
      ) : null}

      {status.checksumSha256 ? (
        <p className="break-all font-mono text-[11px] text-zinc-600">
          SHA-256: {status.checksumSha256}
        </p>
      ) : null}
    </div>
  );
}

type VerificationStatusContentProps = Readonly<{
  errorMessage: string;
  isLoading: boolean;
  scheduled: ScheduledBackupStatus | null | undefined;
  status: BackupVerificationStatus | null | undefined;
  locale: Locale;
  t: Translator;
}>;

function VerificationStatusContent({
  errorMessage,
  isLoading,
  scheduled,
  status,
  locale,
  t,
}: VerificationStatusContentProps) {
  return (
    <>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('Loading verification status…')}
        </div>
      ) : null}
      {errorMessage ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </div>
      ) : null}
      {!isLoading && !errorMessage && !status ? (
        <p className="text-sm text-zinc-500">{t('No verification result is available yet.')}</p>
      ) : null}
      {scheduled ? <ScheduledBackupEvidence status={scheduled} locale={locale} t={t} /> : null}
      {status ? <RecoveryEvidence status={status} locale={locale} t={t} /> : null}
    </>
  );
}

type VerificationJobFeedbackProps = Readonly<{
  active: boolean;
  cancelling: boolean;
  error: string;
  failed: boolean;
  job: JobStatusDto | undefined;
  message: string;
  onCancel: () => void;
  t: Translator;
}>;

function VerificationJobFeedback({
  active,
  cancelling,
  error,
  failed,
  job,
  message,
  onCancel,
  t,
}: VerificationJobFeedbackProps) {
  return (
    <>
      {message ? (
        <output className={`flex items-center gap-2 text-sm ${failed ? 'text-red-300' : 'text-emerald-400'}`}>
          {failed
            ? <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          {message}
        </output>
      ) : null}
      {active && job ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling || job.status === 'CANCEL_REQUESTED'}
          className="min-h-10 rounded-lg border border-sky-300/30 px-3 text-sm font-medium text-sky-200 hover:bg-sky-400/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelling ? t('Cancelling…') : t('Cancel backup verification')}
        </button>
      ) : null}
      {error ? (
        <div role="alert" className="flex items-start gap-2 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : null}
    </>
  );
}

export function BackupVerificationPanel() {
  const { locale, t } = useLanguage();
  const { data, error, isLoading, mutate } = useSWR(endpoint, verificationFetcher, {
    refreshInterval: verificationPollingInterval,
    revalidateOnFocus: true,
  });
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');

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
    { refreshInterval: jobPollingInterval },
  );
  const jobActive = isActiveJob(activeJobId, activeJob);

  const requestVerification = async () => {
    setRequesting(true);
    setRequestMessage('');
    setRequestError('');
    try {
      const accepted = await responseJson(await fetch(endpoint, { method: 'POST' }));
      if (typeof accepted?.jobRunId !== 'string') {
        throw new TypeError('Backup verification job was not accepted.');
      }
      globalThis.sessionStorage.setItem(activeJobStorageKey, accepted.jobRunId);
      setActiveJobId(accepted.jobRunId);
      setRequestMessage(t('Verification request accepted. The isolated restore is starting.'));
      await mutate();
    } catch (error_) {
      setRequestError(
        error_ instanceof Error
          ? error_.message
          : t('Backup verification could not be requested.'),
      );
    } finally {
      setRequesting(false);
    }
  };

  const cancelVerification = async () => {
    if (!activeJobId) return;
    setCancelling(true);
    setRequestError('');
    try {
      const cancelled = await responseJson(await fetch(
        `/api/admin/jobs/${encodeURIComponent(activeJobId)}`,
        { method: 'DELETE' },
      ));
      await mutateActiveJob(cancelled, { revalidate: false });
      setRequestMessage(t('Backup verification cancelled.'));
    } catch (error_) {
      setRequestError(error_ instanceof Error
        ? error_.message
        : t('Backup verification could not be cancelled.'));
    } finally {
      setCancelling(false);
    }
  };

  const visibleRequestMessage = activeJob ? jobMessage(activeJob, t) : requestMessage;
  const visibleRequestError = requestError
    || activeJobError?.message
    || activeJob?.errorMessage
    || '';
  const jobFailed = isFailedJob(activeJob);

  return (
    <section className="overflow-hidden rounded-2xl border border-sky-500/20 bg-zinc-900/50">
      <div className="flex flex-col gap-4 border-b border-zinc-800 bg-zinc-900/70 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400">
            <DatabaseZap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-white">{t('PostgreSQL Recovery Verification')}</h2>
            <p className="mt-1 max-w-3xl text-sm text-zinc-400">
              {t('Restores the latest deployment dump into a disposable, network-isolated PostgreSQL instance and checks its schema and representative records.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={requestVerification}
          disabled={requesting || jobActive}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {requesting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          {t('Verify Latest PostgreSQL Backup')}
        </button>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <VerificationStatusContent
          errorMessage={error?.message || ''}
          isLoading={isLoading}
          scheduled={data?.scheduled}
          status={data?.status}
          locale={locale}
          t={t}
        />
        <VerificationJobFeedback
          active={jobActive}
          cancelling={cancelling}
          error={visibleRequestError}
          failed={jobFailed}
          job={activeJob}
          message={visibleRequestMessage}
          onCancel={cancelVerification}
          t={t}
        />
        <div className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-xs leading-5 text-zinc-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
          {t('The application receives only bounded verification metadata. Database URLs, credentials, raw PostgreSQL output, and backup contents remain on the host.')}
        </div>
      </div>
    </section>
  );
}
