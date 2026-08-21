'use client';

import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import type {
  BackupVerificationStatus,
  BackupVerificationStatusName,
  ScheduledBackupStatus,
} from '@/lib/backup-verification';

const endpoint = '/api/admin/backups/verification';

const statusPresentation: Record<BackupVerificationStatusName, {
  label: string;
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

function ScheduledBackupEvidence({ status }: Readonly<{ status: ScheduledBackupStatus }>) {
  const labels = { RUNNING: 'Running', VERIFIED: 'Verified', FAILED: 'Failed' } as const;
  const healthy = status.status === 'VERIFIED';
  return (
    <div className={`rounded-xl border p-4 ${healthy
      ? 'border-emerald-500/30 bg-emerald-500/10'
      : 'border-amber-500/30 bg-amber-500/10'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-100">
          Scheduled backup: {labels[status.status]}
        </p>
        <span className="text-xs uppercase tracking-wide text-zinc-400">{status.environment}</span>
      </div>
      <p className="mt-2 break-all font-mono text-xs text-zinc-300">
        {status.backupName ?? 'No completed scheduled backup'}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {status.diagnosticCode} · {formatTimestamp(status.completedAt)}
      </p>
    </div>
  );
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return 'Unknown size';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(value: string | null) {
  if (!value) return 'Not completed';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function RecoveryEvidence({ status }: Readonly<{ status: BackupVerificationStatus }>) {
  const presentation = statusPresentation[status.status];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${presentation.className}`}>
          {presentation.label}
        </span>
        <span className="font-mono text-sm text-zinc-300">{status.backupName || 'Latest host backup'}</span>
        <span className="text-xs text-zinc-500">{formatBytes(status.sizeBytes)}</span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <dt className="text-xs text-zinc-500">Source</dt>
          <dd className="mt-1 font-medium text-zinc-200">
            {status.sourcePostgresVersion ? `PostgreSQL ${status.sourcePostgresVersion}` : 'Unknown'}
          </dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <dt className="text-xs text-zinc-500">Restore verifier</dt>
          <dd className="mt-1 font-medium text-zinc-200">
            {status.verificationPostgresVersion
              ? `PostgreSQL ${status.verificationPostgresVersion}`
              : 'Unknown'}
          </dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <dt className="text-xs text-zinc-500">Completed</dt>
          <dd className="mt-1 font-medium text-zinc-200">{formatTimestamp(status.completedAt)}</dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <dt className="text-xs text-zinc-500">Diagnostic code</dt>
          <dd className="mt-1 break-words font-mono text-xs text-zinc-300">{status.diagnosticCode}</dd>
        </div>
      </dl>

      {status.checks ? (
        <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1.5">{status.checks.publicTableCount} tables</span>
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1.5">{status.checks.migrationCount} migrations</span>
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1.5">{status.checks.userCount} users</span>
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1.5">{status.checks.contentCount} content records</span>
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

export function BackupVerificationPanel() {
  const { data, error, isLoading, mutate } = useSWR(endpoint, verificationFetcher, {
    refreshInterval: (latest) => {
      const state = latest?.status?.status;
      return state === 'PENDING' || state === 'RUNNING' ? 3_000 : 0;
    },
    revalidateOnFocus: true,
  });
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');

  const requestVerification = async () => {
    setRequesting(true);
    setRequestMessage('');
    setRequestError('');
    try {
      await responseJson(await fetch(endpoint, { method: 'POST' }));
      setRequestMessage('Verification request accepted. The isolated restore is starting.');
      await mutate();
    } catch (error_) {
      setRequestError(
        error_ instanceof Error
          ? error_.message
          : 'Backup verification could not be requested.',
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-sky-500/20 bg-zinc-900/50">
      <div className="flex flex-col gap-4 border-b border-zinc-800 bg-zinc-900/70 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400">
            <DatabaseZap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-white">PostgreSQL Recovery Verification</h2>
            <p className="mt-1 max-w-3xl text-sm text-zinc-400">
              Restores the latest deployment dump into a disposable, network-isolated PostgreSQL instance and checks its schema and representative records.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={requestVerification}
          disabled={requesting}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {requesting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          Verify Latest PostgreSQL Backup
        </button>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading verification status…
          </div>
        ) : null}
        {error ? (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error.message}
          </div>
        ) : null}
        {!isLoading && !error && !data?.status ? (
          <p className="text-sm text-zinc-500">No verification result is available yet.</p>
        ) : null}
        {data?.scheduled ? <ScheduledBackupEvidence status={data.scheduled} /> : null}
        {data?.status ? <RecoveryEvidence status={data.status} /> : null}
        {requestMessage ? (
          <output className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {requestMessage}
          </output>
        ) : null}
        {requestError ? (
          <div role="alert" className="flex items-start gap-2 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {requestError}
          </div>
        ) : null}
        <div className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-xs leading-5 text-zinc-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
          The application receives only bounded verification metadata. Database URLs, credentials, raw PostgreSQL output, and backup contents remain on the host.
        </div>
      </div>
    </section>
  );
}
