'use client';

import { AlertTriangle, CheckCircle2, DatabaseBackup, Loader2 } from 'lucide-react';
import { useState } from 'react';

const endpoint = '/api/admin/backups/retention';

async function responseJson(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || 'Backup retention cleanup could not be queued.');
  }
  return body;
}

export function BackupRetentionPanel() {
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestCleanup = async () => {
    setRequesting(true);
    setMessage('');
    setError('');
    try {
      const idempotencyKey = globalThis.crypto.randomUUID?.() ?? `retention_${Date.now()}`;
      await responseJson(await fetch(endpoint, {
        method: 'POST',
        headers: { 'idempotency-key': idempotencyKey },
      }));
      setMessage('Retention cleanup queued. Progress is recorded as a background job.');
    } catch (error_) {
      setError(error_ instanceof Error
        ? error_.message
        : 'Backup retention cleanup could not be queued.');
    } finally {
      setRequesting(false);
    }
  };

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
          disabled={requesting}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50 sm:w-auto"
        >
          {requesting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Run Backup Retention Cleanup
        </button>
      </div>
      {message || error ? (
        <div className="border-t border-zinc-800 px-5 py-4 sm:px-6">
          {message ? (
            <output className="flex items-start gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {message}
            </output>
          ) : null}
          {error ? (
            <div role="alert" className="flex items-start gap-2 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
