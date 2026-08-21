'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Clock3,
  Film,
  ImageIcon,
  RefreshCw,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type {
  MediaFindingCode,
  MediaFindingSeverity,
  MediaResourceKind,
} from '@/lib/administration/media-integrity-scanner';
import type { TranslationKey } from '@/lib/i18n/translations';

type ScanDto = {
  id: string;
  scope: 'CATALOG' | 'CONTENT';
  requestedContentId: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt: string | null;
  contentCount: number;
  findingCount: number;
  criticalCount: number;
  warningCount: number;
};

type MediaHealthDto = {
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  stale: boolean;
  runningScan: (ScanDto & { stale: boolean }) | null;
  lastScan: ScanDto | null;
  findings: Array<{
    id: string;
    contentId: string | null;
    contentTitle: string | null;
    contentType: 'Movie' | 'Serie' | null;
    resourceKind: MediaResourceKind;
    severity: MediaFindingSeverity;
    code: MediaFindingCode;
    metadata: Record<string, string | number | boolean | null> | null;
    createdAt: string;
  }>;
  total: number;
};

type MediaHealthFinding = MediaHealthDto['findings'][number];
type LanguageApi = ReturnType<typeof useLanguage>;

const SEVERITY_STYLES: Record<MediaFindingSeverity, string> = {
  CRITICAL: 'border-red-500/30 bg-red-500/10 text-red-300',
  WARNING: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  INFO: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

const fetcher = async (url: string): Promise<MediaHealthDto> => {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Media health could not be loaded.');
  return body;
};

function remediationKey(code: MediaFindingCode): TranslationKey {
  if (code === 'VIDEO_MISSING') return 'The referenced video file is missing.';
  if (code.startsWith('THUMBNAIL_')) return 'The referenced thumbnail is missing or invalid.';
  if (code.endsWith('_REFERENCE_UNSAFE')) {
    return 'Keep the reference inside the configured media root and update it from the content editor.';
  }
  if (code.startsWith('VIDEO_') || code.startsWith('AUDIO_')) {
    return 'Review the video container, streams, codecs, and duration before replacing the catalog reference.';
  }
  if (code.startsWith('DUPLICATE_') || code.startsWith('ORPHAN_')) {
    return 'Review duplicate or unused files manually. The scanner never deletes media.';
  }
  return 'Review this finding in the content editor. No automatic repair is performed.';
}

function Metric({
  label,
  value,
  metric,
  tone = 'text-white',
}: Readonly<{ label: string; value: string | number; metric: string; tone?: string }>) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p data-metric={metric} className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </article>
  );
}

function buildMediaHealthUrl(filters: {
  severity: string;
  resourceKind: string;
  contentType: string;
  scanStatus: string;
}) {
  const params = new URLSearchParams();
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.resourceKind) params.set('resourceKind', filters.resourceKind);
  if (filters.contentType) params.set('contentType', filters.contentType);
  if (filters.scanStatus) params.set('scanStatus', filters.scanStatus);
  const query = params.toString();
  return query ? `/api/admin/media-health?${query}` : '/api/admin/media-health';
}

function formatLastScan(
  data: MediaHealthDto | undefined,
  locale: LanguageApi['locale'],
  neverLabel: string,
) {
  const completedAt = data?.lastScan?.completedAt;
  if (!completedAt) return neverLabel;
  return new Date(completedAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US');
}

function ScannerAvailability({
  availability,
  t,
}: Readonly<{
  availability: MediaHealthDto['availability'] | undefined;
  t: LanguageApi['t'];
}>) {
  const unavailable = availability === 'UNAVAILABLE';
  const containerStyle = unavailable
    ? 'border-red-500/30 bg-red-500/10'
    : 'border-emerald-500/30 bg-emerald-500/10';
  const icon = unavailable
    ? <ShieldAlert className="mt-0.5 h-5 w-5 text-red-400" aria-hidden="true" />
    : <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" aria-hidden="true" />;
  const label = t(unavailable ? 'Scanner unavailable' : 'Scanner available');

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${containerStyle}`}>
      {icon}
      <div>
        <p className="font-semibold text-zinc-100">{label}</p>
        {unavailable ? (
          <p className="mt-1 text-sm text-zinc-400">
            {t('The ffprobe runtime cannot be reached. Scans may fail until the deployment is repaired.')}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const CONTENT_TYPE_LABELS: Record<NonNullable<MediaHealthFinding['contentType']>, TranslationKey> = {
  Movie: 'Movie',
  Serie: 'Series',
};

const RESOURCE_KIND_LABELS: Record<MediaResourceKind, TranslationKey> = {
  VIDEO: 'Video',
  THUMBNAIL: 'Thumbnail',
};

function FindingCard({ finding, t }: Readonly<{
  finding: MediaHealthFinding;
  t: LanguageApi['t'];
}>) {
  const title = finding.contentTitle ?? finding.contentId ?? t('Orphaned media resource');
  const contentTypeLabel = finding.contentType
    ? t(CONTENT_TYPE_LABELS[finding.contentType])
    : t('Orphaned media resource');
  const resourceIcon = finding.resourceKind === 'VIDEO'
    ? <Film className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" aria-hidden="true" />
    : <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" aria-hidden="true" />;

  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 [content-visibility:auto]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {resourceIcon}
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">{title}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {contentTypeLabel} · {t(RESOURCE_KIND_LABELS[finding.resourceKind])}
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[finding.severity]}`}>
          {finding.severity}
        </span>
      </div>
      <p className="mt-4 text-sm text-zinc-300">{t(remediationKey(finding.code))}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-3">
        <p className="font-mono text-xs text-zinc-600" title={t('Finding code')}>{finding.code}</p>
        {finding.contentId ? (
          <Link
            href={`/admin/movies/${encodeURIComponent(finding.contentId)}/edit`}
            aria-label={`${t('Edit')} ${title}`}
            className="text-sm font-medium text-red-300 hover:text-red-200"
          >
            {t('Edit')}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

function FindingResults({
  data,
  error,
  isLoading,
  message,
  t,
}: Readonly<{
  data: MediaHealthDto | undefined;
  error: Error | undefined;
  isLoading: boolean;
  message: LanguageApi['message'];
  t: LanguageApi['t'];
}>) {
  if (isLoading) {
    return <div aria-label={t('Media findings are loading')} className="h-72 animate-pulse bg-zinc-900" />;
  }
  if (error) return <p role="alert" className="p-5 text-red-400">{error.message}</p>;
  if (!data) return null;
  if (data.findings.length === 0) {
    return <p className="p-14 text-center text-zinc-500">{t('No findings match these filters.')}</p>;
  }

  return (
    <>
      <ol className="grid gap-3 p-3 sm:p-4 xl:grid-cols-2" aria-label={t('Media Health')}>
        {data.findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} t={t} />
        ))}
      </ol>
      {data.total > data.findings.length ? (
        <p className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          {message('mediaFindingsShown', { shown: data.findings.length, total: data.total })}
        </p>
      ) : null}
    </>
  );
}

export default function AdminMediaHealthPage() {
  const { locale, message, t } = useLanguage();
  const [severity, setSeverity] = useState('');
  const [resourceKind, setResourceKind] = useState('');
  const [contentType, setContentType] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [contentId, setContentId] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requestUrl = useMemo(() => buildMediaHealthUrl({
    severity,
    resourceKind,
    contentType,
    scanStatus,
  }), [severity, resourceKind, contentType, scanStatus]);

  const { data, error, isLoading, mutate } = useSWR(requestUrl, fetcher, {
    keepPreviousData: true,
    refreshInterval: (latest: MediaHealthDto | undefined) => latest?.runningScan ? 3_000 : 0,
  });
  const scanActive = submitting || Boolean(data?.runningScan);

  const startScan = async (selectedContentId?: string) => {
    setSubmitting(true);
    setScanError('');
    setScanMessage(t('Scan in progress'));
    try {
      const response = await fetch('/api/admin/media-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedContentId ? { contentId: selectedContentId } : {}),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Media scan failed.');
      await mutate();
      setScanMessage(t('Scan completed and results persisted.'));
    } catch (error_) {
      setScanMessage('');
      setScanError(error_ instanceof Error ? error_.message : 'Media scan failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSeverity('');
    setResourceKind('');
    setContentType('');
    setScanStatus('');
  };

  const lastScanDate = formatLastScan(data, locale, t('Never'));
  const scannerUnavailable = data?.availability === 'UNAVAILABLE';
  const runningScanLabel = data?.runningScan?.scope === 'CATALOG'
    ? 'A catalog scan is currently running.'
    : 'A content scan is currently running.';

  return (
    <div>
      <AdminPageHeader
        title={t('Media Health')}
        description={t('Inspect catalog media without modifying files or records.')}
        actions={(
          <button
            type="button"
            onClick={() => startScan()}
            disabled={scanActive || scannerUnavailable}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ScanSearch className="h-4 w-4" aria-hidden="true" />
            {t('Scan full catalog')}
          </button>
        )}
      />

      <div className="mb-5 grid gap-3 lg:grid-cols-2">
        <ScannerAvailability availability={data?.availability} t={t} />
        {data?.stale ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <Clock3 className="mt-0.5 h-5 w-5 text-amber-400" aria-hidden="true" />
            <div><p className="font-semibold text-zinc-100">{t('Scan results are stale.')}</p><p className="mt-1 text-sm text-zinc-400">{t('Run a new scan before relying on the current media-health summary.')}</p></div>
          </div>
        ) : null}
      </div>

      {data?.runningScan ? (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-200">
          <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>{t(runningScanLabel)}</span>
        </div>
      ) : null}
      {scanMessage ? <output aria-live="polite" className="mb-5 block rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-200">{scanMessage}</output> : null}
      {scanError ? <p role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{scanError}</p> : null}

      <section aria-label={t('Media Health')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t('Critical findings')} value={data?.lastScan?.criticalCount ?? 0} metric="critical" tone="text-red-300" />
        <Metric label={t('Warnings')} value={data?.lastScan?.warningCount ?? 0} metric="warnings" tone="text-amber-300" />
        <Metric label={t('Scanned content')} value={data?.lastScan?.contentCount ?? 0} metric="content" />
        <Metric label={t('Last scan')} value={lastScanDate} metric="last-scan" />
      </section>

      <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
        <h2 className="font-semibold text-white">{t('Scan one content item')}</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">{t('Content ID')}</span>
            <input value={contentId} onChange={(event) => setContentId(event.target.value)} placeholder={t('Content ID')} className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-red-500" />
          </label>
          <button type="button" disabled={scanActive || !contentId.trim() || scannerUnavailable} onClick={() => startScan(contentId.trim())} className="h-10 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">{t('Start content scan')}</button>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="grid gap-3 border-b border-zinc-800 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <select aria-label={t('Filter by severity')} value={severity} onChange={(event) => setSeverity(event.target.value)} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="">{t('All severities')}</option><option value="CRITICAL">{t('Critical')}</option><option value="WARNING">{t('Warnings')}</option><option value="INFO">{t('Information')}</option></select>
          <select aria-label={t('Filter by resource type')} value={resourceKind} onChange={(event) => setResourceKind(event.target.value)} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="">{t('All resource types')}</option><option value="VIDEO">{t('Video')}</option><option value="THUMBNAIL">{t('Thumbnail')}</option></select>
          <select aria-label={t('Filter by content kind')} value={contentType} onChange={(event) => setContentType(event.target.value)} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="">{t('All content kinds')}</option><option value="Movie">{t('Movie')}</option><option value="Serie">{t('Series')}</option></select>
          <select aria-label={t('Filter by scan status')} value={scanStatus} onChange={(event) => setScanStatus(event.target.value)} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="">{t('All scan statuses')}</option><option value="RUNNING">{t('Running')}</option><option value="COMPLETED">{t('Completed')}</option><option value="FAILED">{t('Failed')}</option></select>
          <button type="button" onClick={resetFilters} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800"><RotateCcw className="h-4 w-4" aria-hidden="true" />{t('Reset filters')}</button>
        </div>

        <FindingResults data={data} error={error} isLoading={isLoading} message={message} t={t} />
      </section>
    </div>
  );
}
