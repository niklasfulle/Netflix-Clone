'use client';

import Link from 'next/link';
import { Download, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
  ADMIN_AUDIT_ACTIONS,
  type AdminAuditAction,
  type AdminAuditMetadata,
  type AdminAuditOutcome,
  type AdminAuditTargetType,
} from '@/lib/administration/admin-audit';
import type { TranslationKey } from '@/lib/i18n/translations';

type AuditEvent = {
  id: string;
  actorUserId: string;
  actorName: string | null;
  actorRole: 'ADMIN' | 'USER';
  action: AdminAuditAction;
  targetType: AdminAuditTargetType | null;
  targetId: string | null;
  outcome: AdminAuditOutcome;
  correlationId: string | null;
  metadata: AdminAuditMetadata | null;
  createdAt: string;
};

type AuditPage = {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  retentionDays: number;
};

const ACTION_LABELS: Record<AdminAuditAction, TranslationKey> = {
  'content.create': 'Created content',
  'content.update': 'Updated content',
  'content.publish': 'Published content',
  'content.archive': 'Archived content',
  'content.delete': 'Deleted content',
  'actor.create': 'Created actor',
  'actor.update': 'Updated actor',
  'actor.merge': 'Merged actors',
  'actor.delete': 'Deleted actor',
  'user.role_change': 'Changed user role',
  'user.block': 'Blocked user',
  'user.unblock': 'Unblocked user',
  'backup.create': 'Created backup',
  'backup.restore': 'Restored backup',
  'backup.verify': 'Verified backup',
  'media.scan': 'Scanned media',
  'deployment.manage': 'Managed deployment',
  'security.settings_change': 'Changed security settings',
};

const TARGET_TYPES: AdminAuditTargetType[] = [
  'content',
  'actor',
  'user',
  'backup',
  'media_scan',
  'deployment',
  'security_settings',
];

const TARGET_TYPE_LABELS: Record<AdminAuditTargetType, TranslationKey> = {
  content: 'Content target',
  actor: 'Actor target',
  user: 'User target',
  backup: 'Backup target',
  media_scan: 'Media scan target',
  deployment: 'Deployment target',
  security_settings: 'Security settings target',
};

const METADATA_LABELS: Record<string, TranslationKey> = {
  contentType: 'Content type',
  initialStatus: 'Initial status',
  changedFields: 'Changed fields',
  previousStatus: 'Previous status',
  nextStatus: 'Next status',
  mergedCount: 'Merged count',
  associatedContentCount: 'Associated content count',
  previousRole: 'Previous role',
  nextRole: 'Next role',
  reasonCode: 'Reason code',
  hasExpiry: 'Has expiry',
  source: 'Source',
  scheduled: 'Scheduled',
  verificationStatus: 'Verification status',
  scope: 'Scope',
  itemCount: 'Item count',
  environment: 'Environment',
  version: 'Version',
  operation: 'Operation',
};

const OUTCOME_STYLES: Record<AdminAuditOutcome, string> = {
  SUCCEEDED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  DENIED: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  FAILED: 'border-red-500/20 bg-red-500/10 text-red-300',
};

const OUTCOME_LABELS: Record<AdminAuditOutcome, TranslationKey> = {
  SUCCEEDED: 'Succeeded',
  DENIED: 'Denied',
  FAILED: 'Failed',
};

const fetcher = async (url: string): Promise<AuditPage> => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Audit events could not be loaded.');
  }
  return data;
};

function targetHref(event: AuditEvent) {
  if (!event.targetId || event.outcome === 'DENIED') return null;
  const id = encodeURIComponent(event.targetId);
  const destinations: Partial<Record<AdminAuditTargetType, string>> = {
    content: `/admin/movies/${id}/edit`,
    actor: '/admin/actors',
    user: '/admin/users',
    backup: '/admin/backups',
    media_scan: '/admin/system',
    deployment: '/admin/system',
    security_settings: '/admin/system',
  };
  return event.targetType ? destinations[event.targetType] ?? null : null;
}

function metadataLabel(key: string) {
  return key.replaceAll(/([a-z])([A-Z])/gu, '$1 $2').replace(/^./u, (letter) => letter.toUpperCase());
}

function metadataValue(value: AdminAuditMetadata[string]) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') return value;
  return value.toString();
}

function AuditTarget({
  auditEvent,
  href,
  t,
}: Readonly<{
  auditEvent: AuditEvent;
  href: string | null;
  t: ReturnType<typeof useLanguage>['t'];
}>) {
  if (!auditEvent.targetId) return null;

  let target = <span className="font-mono text-zinc-300">{auditEvent.targetId}</span>;
  if (href) {
    target = (
      <Link
        href={href}
        className="font-mono text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-white"
      >
        {auditEvent.targetId}
      </Link>
    );
  }

  return <p className="mt-2 text-sm text-zinc-500">{t('Target')}: {target}</p>;
}

export default function AdminAuditPage() {
  const { locale, message, t } = useLanguage();
  const [actorInput, setActorInput] = useState('');
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setActor(actorInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [actorInput]);

  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (actor) params.set('actor', actor);
    if (action) params.set('action', action);
    if (targetType) params.set('targetType', targetType);
    if (outcome) params.set('outcome', outcome);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params;
  }, [actor, action, targetType, outcome, from, to]);

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams(filterParams);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return `/api/admin/audit?${params.toString()}`;
  }, [filterParams, page, pageSize]);
  const exportHref = `/api/admin/audit/export?${filterParams.toString()}`;
  const { data, error, isLoading } = useSWR(requestUrl, fetcher, { keepPreviousData: true });

  const resetFilters = () => {
    setActorInput('');
    setActor('');
    setAction('');
    setTargetType('');
    setOutcome('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div>
      <AdminPageHeader
        title={t('Audit Log')}
        description={t('Review security-relevant administrator actions and their outcomes.')}
        actions={(
          <Link
            href={exportHref}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('Export CSV')}
          </Link>
        )}
      />

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="grid gap-3 border-b border-zinc-800 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative sm:col-span-2">
            <span className="sr-only">{t('Search actor')}</span>
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-500" aria-hidden="true" />
            <input
              type="search"
              value={actorInput}
              onChange={(event) => setActorInput(event.target.value)}
              aria-label={t('Search actor')}
              placeholder={t('Actor name, email, or ID')}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500"
            />
          </label>
          <select aria-label={t('Filter by action')} value={action} onChange={(event) => updateFilter(setAction, event.target.value)} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
            <option value="">{t('All actions')}</option>
            {ADMIN_AUDIT_ACTIONS.map((item) => <option key={item} value={item}>{t(ACTION_LABELS[item])}</option>)}
          </select>
          <select aria-label={t('Filter by target type')} value={targetType} onChange={(event) => updateFilter(setTargetType, event.target.value)} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
            <option value="">{t('All target types')}</option>
            {TARGET_TYPES.map((item) => <option key={item} value={item}>{t(TARGET_TYPE_LABELS[item])}</option>)}
          </select>
          <select aria-label={t('Filter by outcome')} value={outcome} onChange={(event) => updateFilter(setOutcome, event.target.value)} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200">
            <option value="">{t('All outcomes')}</option>
            <option value="SUCCEEDED">{t('Succeeded')}</option>
            <option value="DENIED">{t('Denied')}</option>
            <option value="FAILED">{t('Failed')}</option>
          </select>
          <label className="text-xs font-medium text-zinc-400">
            {t('From date')}
            <input type="datetime-local" value={from} onChange={(event) => updateFilter(setFrom, event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200" />
          </label>
          <label className="text-xs font-medium text-zinc-400">
            {t('To date')}
            <input type="datetime-local" value={to} onChange={(event) => updateFilter(setTo, event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200" />
          </label>
          <button type="button" onClick={resetFilters} className="inline-flex h-10 self-end items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 hover:bg-zinc-800">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t('Reset filters')}
          </button>
        </div>

        <div className="flex items-start gap-3 border-b border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <p>{message('auditRetention', { days: data?.retentionDays ?? 365 })}</p>
        </div>

        {isLoading ? <div className="h-72 animate-pulse bg-zinc-900" aria-label={t('Audit events are loading')} /> : null}
        {error ? <p role="alert" className="p-5 text-red-400">{error.message}</p> : null}
        {data?.events.length === 0 ? <p className="p-14 text-center text-zinc-500">{t('No audit events match these filters.')}</p> : null}
        {data?.events.length ? (
          <ol aria-label={t('Audit events')} className="divide-y divide-zinc-800">
            {data.events.map((auditEvent) => {
              const href = targetHref(auditEvent);
              return (
                <li key={auditEvent.id} className="grid gap-4 p-4 transition hover:bg-zinc-800/35 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:p-5 [content-visibility:auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-white">{t(ACTION_LABELS[auditEvent.action])}</h2>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${OUTCOME_STYLES[auditEvent.outcome]}`}>{t(OUTCOME_LABELS[auditEvent.outcome])}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">
                      <span className="font-medium text-zinc-200">{auditEvent.actorName || auditEvent.actorUserId}</span>
                      <span className="mx-2 text-zinc-700">·</span>
                      <time dateTime={auditEvent.createdAt}>{new Date(auditEvent.createdAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-US')}</time>
                    </p>
                    <AuditTarget auditEvent={auditEvent} href={href} t={t} />
                    {auditEvent.metadata ? (
                      <dl className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(auditEvent.metadata).map(([key, value]) => {
                          const label = METADATA_LABELS[key] ? t(METADATA_LABELS[key]) : metadataLabel(key);
                          return (
                            <div key={key} className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400">
                              <dt className="inline text-zinc-600">{label}: </dt>
                              <dd className="inline">{metadataValue(value)}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    ) : null}
                  </div>
                  <div className="text-left text-xs text-zinc-600 lg:text-right">
                    <p>{t(auditEvent.actorRole === 'ADMIN' ? 'Administrator' : 'Member')}</p>
                    {auditEvent.correlationId ? <p className="mt-1 font-mono" title={t('Correlation ID')}>{auditEvent.correlationId}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}
        {data ? <AdminPagination page={page} totalPages={data.totalPages} total={data.total} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /> : null}
      </section>
    </div>
  );
}
