"use client";

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import useSWR from 'swr';
import { BarChart3, CheckCircle2, Play, TriangleAlert } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { analysisActive, analysisErrorKey, analysisStatus } from '@/components/admin/VideoAnalysisReview';
import fetcher from '@/lib/fetcher';
import { scoreSample } from '@/lib/video-evaluation/metrics';
import { formatExampleTime } from '@/lib/video-examples/types';
import type { readVideoEvaluations } from '@/lib/video-evaluation/service';
import type { TranslationKey } from '@/lib/i18n/translations';

type Data = Awaited<ReturnType<typeof readVideoEvaluations>>;
const percent = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)} %`;
const outcomeKeys = { tp: 'Correctly recognized', fn: 'Missed', fp: 'False suggestion', tn: 'Correctly absent' } as const;
const categoryHeaders: TranslationKey[] = ['Category', ...Object.values(outcomeKeys), 'Precision', 'Recall'];
const statusKeys: Record<string, TranslationKey> = { QUEUED: 'Queued', RUNNING: 'Analysis in progress', SUCCEEDED: 'Comparison completed', FAILED: 'Analysis stopped', CANCELLED: 'Cancelled', CANCEL_REQUESTED: 'Cancellation requested', DEAD_LETTER: 'Analysis stopped' };
const errorKeys: Record<string, TranslationKey> = { NO_REVIEWED_EXAMPLES: 'Mark at least one segment with a definite category judgment first.', EVALUATION_LIMIT: 'A comparison supports up to 500 marked segments.', EVALUATION_UNAVAILABLE: 'Comparison results could not be loaded.' };
const VideoEvaluationEvidence = dynamic(() => import('./VideoEvaluationEvidence').then(module => module.VideoEvaluationEvidence));

export function VideoEvaluationDashboard() {
  const { t, locale } = useLanguage();
  const [selected, setSelected] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(true);
  const [openSamples, setOpenSamples] = useState<Set<string>>(() => new Set());
  const requestId = useRef('');
  const { data, error: loadError, mutate } = useSWR<Data>(`/api/admin/video-evaluations${selected ? `?id=${encodeURIComponent(selected)}` : ''}`, fetcher, { refreshInterval: 3000 });
  const run = data?.runs.find(item => item.id === selected) ?? data?.runs[0];
  const status = run ? analysisStatus(run) : '';
  const active = analysisActive(status);
  const anyActive = data?.runs.some(item => analysisActive(analysisStatus(item)));
  async function request(url: string, method: 'POST' | 'DELETE', body?: object) {
    if (pending) return;
    setPending(true); setError('');
    try {
      const response = await fetch(url, { method, ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
      const result = await response.json();
      if (!response.ok) { setError(t(errorKeys[result.error] ?? analysisErrorKey(result.error))); return; }
      if (result.evaluationId) { setSelected(result.evaluationId); requestId.current = ''; }
      await mutate(undefined, { throwOnError: false });
    } catch { setError(t('Comparison results could not be loaded.')); }
    finally { setPending(false); }
  }
  return <div className="space-y-6">
    <AdminPageHeader title={t('Compare marked segments')} description={t('Compare local model predictions with your saved category judgments.')} actions={<Link href="/admin/video-analysis" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-white">{t('Video analysis')}</Link>} />
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><BarChart3 aria-hidden="true" className="h-6 w-6 text-red-400" /><p className="text-sm text-zinc-300">{data?.exampleCount ?? 0} {t('marked segments')} · {data?.videoCount ?? 0} {t(data?.videoCount === 1 ? 'Video' : 'Videos')}</p></div><Button type="button" disabled={pending || !data?.available || !data.exampleCount || anyActive} onClick={() => { requestId.current ||= crypto.randomUUID(); void request('/api/admin/video-evaluations', 'POST', { requestId: requestId.current }); }} className="min-h-11 gap-2 bg-red-600 text-white hover:bg-red-500"><Play aria-hidden="true" className="h-4 w-4" />{t('Start comparison')}</Button></div>
      <p className="text-sm leading-6 text-zinc-400">{t('Only explicit present and absent judgments are scored. Uncertain and unreviewed categories are ignored. This run does not train the model or change category assignments.')}</p>
      <p className="text-xs leading-5 text-zinc-500">{t('Each run saves a snapshot of judgments and the model profile. All segments from a video belong to the same dataset group. Use independent videos to check later improvements.')}</p>
      {data && !data.available && <p className="text-sm text-amber-300">{t('The local analysis model is not ready.')}</p>}
    </section>
    {(error || loadError) && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error || t('Comparison results could not be loaded.')}</p>}
    {!data && !loadError && <output>{t('Loading...')}</output>}
    {data?.runs.length === 0 && <p className="text-sm text-zinc-400">{t('No comparisons yet. Start a run to check your marked segments.')}</p>}
    {!!data?.runs.length && <label className="block text-sm text-zinc-300">{t('Comparison run')}<select value={run?.id ?? ''} onChange={event => setSelected(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white">{data.runs.map(item => <option key={item.id} value={item.id}>{new Date(item.createdAt).toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB')} · {t(statusKeys[analysisStatus(item)] ?? 'Analysis stopped')}</option>)}</select></label>}
    {run && <>
      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold text-white">{status === 'SUCCEEDED' && <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-400" />}{t(statusKeys[status] ?? 'Analysis stopped')}</h2><output className="text-sm text-zinc-400">{run.summary.completed + run.summary.skipped}/{run.sampleCount} {t('marked segments')}</output></div>
        {active && <progress aria-label={t('Comparison progress')} max={100} value={run.jobRun?.progress ?? 0} className="h-2 w-full accent-red-500" />}
        <p className="break-all text-xs text-zinc-500">{t('Model profile')}: {run.model} · {run.threshold}</p>
        {run.errorCode && <p role="alert" className="text-sm text-red-300">{t(errorKeys[run.errorCode] ?? analysisErrorKey(run.errorCode))}</p>}
        {run.summary.skipped > 0 && <p className="flex items-start gap-2 text-sm text-amber-300"><TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />{run.summary.skipped} {t('Segments skipped because the source changed or is unavailable.')}</p>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{(Object.keys(outcomeKeys) as Array<keyof typeof outcomeKeys>).map(key => <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"><p className="text-xs text-zinc-400">{t(outcomeKeys[key])}</p><strong className={`mt-2 block text-2xl tabular-nums ${key === 'fn' || key === 'fp' ? 'text-amber-300' : 'text-emerald-300'}`}>{run.summary[key]}</strong></div>)}</div>
        <p className="text-sm text-zinc-300">{t('Precision')}: {percent(run.summary.precision)} · {t('Recall')}: {percent(run.summary.recall)} · F1: {percent(run.summary.f1)}</p>
        {run.summary.completed > 0 && run.summary.fp + run.summary.tn === 0 && <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-6 text-amber-200">{t('No absent judgments were evaluated. Add explicit absent judgments to measure false suggestions; precision alone is not meaningful yet.')}</p>}
        <p className="text-xs leading-5 text-zinc-500">{t('Precision measures correct suggestions among reviewed predictions; recall measures recognized present categories. Model abstentions count as missed present categories. Scores use the saved analysis confidence threshold. Partial runs show partial results.')}</p>
        <div className="flex flex-wrap gap-3">{run.jobRun && active && <Button type="button" disabled={pending || status === 'CANCEL_REQUESTED'} onClick={() => { void request(`/api/admin/jobs/${run.jobRun!.id}`, 'DELETE'); }}>{t('Cancel')}</Button>}{run.jobRun && ['FAILED', 'DEAD_LETTER'].includes(status) && <Button type="button" disabled={pending || !data?.available} onClick={() => { void request(`/api/admin/jobs/${run.jobRun!.id}`, 'POST'); }}>{t('Resume comparison')}</Button>}</div>
      </section>
      {run.summary.categories.length > 0 && <section className="overflow-hidden rounded-2xl border border-zinc-800"><h2 className="p-5 font-semibold text-white">{t('Results by category')}</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-zinc-900 text-xs text-zinc-400"><tr>{categoryHeaders.map(label => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t(label)}</th>)}</tr></thead><tbody className="divide-y divide-zinc-800">{run.summary.categories.map(category => <tr key={category.categoryId}><th scope="row" className="min-w-40 break-words px-4 py-3 font-medium text-zinc-200">{locale === 'de' ? category.name : category.nameEn || category.name}</th>{(['tp', 'fn', 'fp', 'tn'] as const).map(key => <td key={key} className="px-4 py-3 tabular-nums text-zinc-300">{category[key]}</td>)}<td className="px-4 py-3 text-zinc-300">{percent(category.precision)}</td><td className="px-4 py-3 text-zinc-300">{percent(category.recall)}</td></tr>)}</tbody></table></div></section>}
      <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-white">{t('Compared segments')}</h2><label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={errorsOnly} onChange={event => setErrorsOnly(event.target.checked)} className="accent-red-500" />{t('Show disagreements only')}</label></div>{run.samples.filter(sample => !errorsOnly || !sample.tags || scoreSample(sample.labels, sample.tags, run.threshold).some(label => label.outcome === 'fn' || label.outcome === 'fp')).map(sample => <details key={sample.id} onToggle={event => { const open = event.currentTarget.open; setOpenSamples(current => { const next = new Set(current); if (open) next.add(sample.id); else next.delete(sample.id); return next; }); }} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"><summary className="cursor-pointer break-words text-sm text-zinc-200">{sample.movieTitle ?? t('Video')} · {formatExampleTime(sample.startSeconds)} – {formatExampleTime(sample.endSeconds)} · {t(sample.status === 'COMPLETED' ? 'Comparison completed' : sample.status === 'PENDING' ? 'Queued' : 'Skipped')}</summary><div className="mt-4 space-y-3"><Link href={`/admin/video-analysis/${encodeURIComponent(sample.movieId)}/examples#example-${encodeURIComponent(sample.exampleId)}`} className="text-sm text-red-300 underline">{t('Open marked segment')}</Link><p className="text-xs text-zinc-500">{t('Example version')}: {sample.exampleVersion}</p>{sample.status === 'COMPLETED' && (sample.hasEvidence ? openSamples.has(sample.id) && <VideoEvaluationEvidence evaluationId={run.id} sampleId={sample.id} /> : <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">{t('Original frames are not available for this sample. Start a new comparison.')}</p>)}{sample.tags && scoreSample(sample.labels, sample.tags, run.threshold).map(label => <p key={label.categoryId} className="flex flex-wrap justify-between gap-2 text-sm text-zinc-300"><span>{locale === 'de' ? label.name : label.nameEn || label.name}</span><span className={label.outcome === 'fn' || label.outcome === 'fp' ? 'text-amber-300' : 'text-emerald-300'}>{t(outcomeKeys[label.outcome])}</span></p>)}</div></details>)}</section>
    </>}
  </div>;
}
