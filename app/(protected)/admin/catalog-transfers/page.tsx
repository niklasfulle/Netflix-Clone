"use client";

import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, FileJson, Loader2, RefreshCw, ServerCog } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { TransferJob, TransferOverview, TransferPreview } from '@/lib/catalog-transfers/types';

const ENDPOINT = '/api/admin/catalog-transfers';
const ACTIVE_KEY = 'catalog-transfer-active';
const phaseLabels = {
  queued: 'Waiting for host', exporting: 'Exporting catalog', preparing: 'Preparing replacement videos',
  stopping: 'Stopping application', importing: 'Backing up and importing', restarting: 'Restarting application',
  completed: 'Completed', failed: 'Transfer failed',
} as const;

async function responseData(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Transfer request failed.');
  return data;
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(responseData);

export default function CatalogTransfersPage() {
  const { t } = useLanguage();
  const { data, error: pollError, mutate } = useSWR<TransferOverview>(ENDPOINT, fetcher, { refreshInterval: 2000, errorRetryInterval: 3000 });
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<{ uploadId: string; preview: TransferPreview } | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState('');
  const [pending, setPending] = useState<TransferJob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const active = data?.jobs.find(job => job.id === activeId) || pending;
  const running = Boolean(active && ['queued', 'running'].includes(active.state)) || Boolean(data?.jobs.some(job => ['queued', 'running'].includes(job.state)));
  const disabled = busy || running || !data?.available;

  useEffect(() => {
    try { setActiveId(localStorage.getItem(ACTIVE_KEY) || ''); } catch { /* Storage is optional. */ }
  }, []);

  useEffect(() => {
    if (!active || !['succeeded', 'failed'].includes(active.state)) return;
    try { localStorage.removeItem(ACTIVE_KEY); } catch { /* Storage is optional. */ }
  }, [active]);

  async function start(operation: 'export' | 'import') {
    setError(''); setBusy(true);
    try {
      const result = await responseData(await fetch(ENDPOINT, {
        method: operation === 'export' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation === 'export' ? {} : { uploadId: upload?.uploadId, confirmation }),
      }));
      setPending(result.job); setActiveId(result.job.id);
      try { localStorage.setItem(ACTIVE_KEY, result.job.id); } catch { /* Polling still works without persistent storage. */ }
      if (operation === 'import') { setUpload(null); setFile(null); setConfirmation(''); if (fileRef.current) fileRef.current.value = ''; }
      await mutate();
    } catch (failure) { setError(failure instanceof Error ? failure.message : t('Transfer failed')); }
    finally { setBusy(false); }
  }

  async function inspect() {
    if (!file) return;
    setError(''); setBusy(true); setUpload(null); setConfirmation('');
    try {
      if (!file.size || file.size > 250 * 1024 * 1024) throw new Error(t('Choose a JSON snapshot up to 250 MiB.'));
      const result = await responseData(await fetch(ENDPOINT, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: file }));
      setUpload(result);
    } catch (failure) { setError(failure instanceof Error ? failure.message : t('Transfer failed')); }
    finally { setBusy(false); }
  }

  const buttonStyle = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';
  return <div className="space-y-6">
    <AdminPageHeader title={t('Catalog Transfer')} description={t('Move your catalog between environments with replacement media.')} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-3 text-sm">
      <span>{t('Environment')}: <strong className="uppercase text-zinc-100">{data?.environment || '…'}</strong></span>
      <span className={data?.available ? 'text-emerald-300' : 'text-amber-300'}>{data?.available ? t('Transfer service ready') : t('Transfer service unavailable')}</span>
    </div>
    {!data?.available && !running && <p className="text-sm text-zinc-400">{t('The updated host service is required for transfers and automatic restarts.')}</p>}
    {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
    {pollError && !running && <p role="alert" className="text-sm text-red-300">{t('Transfer status could not be loaded.')}</p>}

    <div className="grid items-start gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <ArrowDownToLine className="mb-4 h-9 w-9 rounded-lg bg-sky-500/10 p-2 text-sky-300" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{t('Export catalog')}</h2>
        <p className="mb-5 mt-2 text-sm leading-6 text-zinc-400">{t('Includes titles, actors, categories and timeline assignments. Accounts and original media stay on this system.')}</p>
        <button type="button" disabled={disabled} onClick={() => start('export')} className={`${buttonStyle} bg-sky-500/15 text-sky-200 hover:bg-sky-500/25`}><FileJson className="h-4 w-4" aria-hidden="true" />{t('Create export')}</button>
        <p className="mt-4 text-xs text-zinc-500">{t('The file becomes available for download when the export is complete.')}</p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <ArrowUpFromLine className="mb-4 h-9 w-9 rounded-lg bg-red-500/10 p-2 text-red-300" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{t('Import catalog')}</h2>
        {data?.canImport ? <>
          <p className="mb-5 mt-2 text-sm leading-6 text-zinc-400">{t('Review a snapshot before replacing the catalog. Target accounts remain available.')}</p>
          <label className="block rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-4">
            <span className="mb-2 block text-sm text-zinc-300">{t('Snapshot JSON file')}</span>
            <input ref={fileRef} type="file" accept=".json,application/json" disabled={disabled} onChange={event => { setFile(event.target.files?.[0] || null); setUpload(null); setConfirmation(''); }} className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-200" />
          </label>
          <button type="button" onClick={inspect} disabled={disabled || !file} className={`${buttonStyle} mt-4 border border-zinc-700 text-zinc-200 hover:bg-zinc-800`}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileJson className="h-4 w-4" aria-hidden="true" />}{t('Upload and preview')}</button>
          {upload && <div className="mt-5 space-y-4 border-t border-zinc-800 pt-5">
            <div className="grid grid-cols-2 gap-3">
              {([['movies', 'Titles'], ['actors', 'Actors'], ['categories', 'Categories'], ['segments', 'Timeline intervals']] as const).map(([key, label]) => <div key={key} className="rounded-lg bg-zinc-950 p-3"><span className="text-xs text-zinc-500">{t(label)}</span><strong className="mt-1 block text-lg">{upload.preview.counts[key] || 0}</strong></div>)}
            </div>
            <p className="text-sm text-zinc-400">{t('Current titles')}: {upload.preview.existingMovies} · {t('Replacement files')}: {upload.preview.mediaFiles}</p>
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-6 text-amber-200">{t('A target backup is created automatically. App and worker restart after the import. Playback is temporarily unavailable.')}</p>
            <label className="block text-sm text-zinc-300">{t('Confirm target database')}: <strong>{upload.preview.database}</strong>
              <input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" />
            </label>
            <button type="button" disabled={disabled || confirmation !== upload.preview.database} onClick={() => start('import')} className={`${buttonStyle} w-full bg-red-600 text-white hover:bg-red-500`}><ServerCog className="h-4 w-4" aria-hidden="true" />{t('Replace catalog and restart')}</button>
          </div>}
        </> : <p className="mt-3 text-sm leading-6 text-zinc-400">{t('Production allows exports only. Import the file on staging or your local system.')}</p>}
      </section>
    </div>

    {active && <section aria-label={t('Transfer progress')} className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
      <div className="flex items-center gap-3">{running ? <RefreshCw className="h-5 w-5 animate-spin text-sky-300" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5 text-zinc-400" aria-hidden="true" />}<h2 className="font-semibold">{t(phaseLabels[active.phase])}</h2><span className="ml-auto font-mono text-sm text-zinc-400">{active.percent}%</span></div>
      <progress aria-label={t('Transfer progress')} value={active.percent} max={100} className="mt-4 h-2 w-full accent-red-600" />
      <div role="status" className="mt-3 text-sm text-zinc-400">
        {pollError && active.operation === 'import' ? t('The system is restarting. This page reconnects automatically; do not start another import.') : null}
        {active.restartCompleted ? t('Import complete. App and worker have restarted successfully.') : null}
        {active.state === 'failed' ? t('The transfer failed. The previous backup is retained; check the host service before retrying.') : null}
      </div>
    </section>}

    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="mb-4 font-semibold">{t('Recent transfers')}</h2>
      {!data?.jobs.length && <p className="text-sm text-zinc-500">{t('No transfers yet.')}</p>}
      <ul className="divide-y divide-zinc-800">{data?.jobs.map(job => <li key={job.id} className="flex flex-wrap items-center gap-3 py-4 text-sm">
        <div className="min-w-0 flex-1"><strong>{t(job.operation === 'export' ? 'Export catalog' : 'Import catalog')}</strong><p className="mt-1 text-xs text-zinc-500">{new Date(job.createdAt).toLocaleString()} · {t(phaseLabels[job.phase])}</p></div>
        {job.operation === 'export' && job.state === 'succeeded' && <a href={`${ENDPOINT}/${job.id}/download`} className={`${buttonStyle} border border-zinc-700 text-sky-200`}><ArrowDownToLine className="h-4 w-4" aria-hidden="true" />{t('Download JSON')}</a>}
        {job.operation === 'import' && job.backupAvailable && ['succeeded', 'failed'].includes(job.state) && <a href={`${ENDPOINT}/${job.id}/download?kind=backup`} className="text-xs text-zinc-400 underline">{t('Download target backup')}</a>}
      </li>)}</ul>
    </section>
  </div>;
}
