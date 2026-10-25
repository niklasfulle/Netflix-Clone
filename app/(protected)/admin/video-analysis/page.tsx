"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { VideoAnalysisReview, analysisActive, analysisErrorKey, analysisStatus, type AnalysisSummary } from '@/components/admin/VideoAnalysisReview';
import fetcher from '@/lib/fetcher';

type Item = { id: string; title: string; type: string; duration: string; videoAnalyses: AnalysisSummary[] };
type ResponseData = { items: Item[]; totalPages: number; model: { enabled: boolean; available: boolean; name: string } };

export default function VideoAnalysisPage() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setSearch(input.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [input]);
  const { data, error: loadError, mutate } = useSWR<ResponseData>(`/api/admin/video-analysis?search=${encodeURIComponent(search)}&page=${page}`, fetcher, { refreshInterval: 3000 });

  async function request(url: string, method: 'POST' | 'DELETE', body?: object) {
    if (pending) return;
    setPending(true); setError('');
    try {
      const response = await fetch(url, { method, ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
      const result = await response.json();
      if (!response.ok) { setError(t(analysisErrorKey(result.error))); return; }
      await mutate(undefined, { throwOnError: false });
    } catch { setError(t('Video analysis could not be completed.')); }
    finally { setPending(false); }
  }

  return <div className="space-y-6">
    <AdminPageHeader title={t('Video analysis')} description={t('Analyze videos locally and collect category suggestions with evidence.')} actions={<Link href="/admin/categories" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-white">{t('Manage categories')}</Link>} />
    <Link href="/admin/video-analysis/evaluation" className="inline-flex min-h-11 items-center rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20">{t('Compare marked segments')}</Link>
    <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <output className={data?.model.available ? 'text-sm text-emerald-300' : 'text-sm text-amber-300'}>{t(data?.model.available ? 'Local model ready' : 'The local analysis model is not ready.')}</output>
      {data && !data.model.available && <p className="text-sm text-zinc-400">{t(data.model.enabled ? 'Start the local GPU service to analyze videos.' : 'Video analysis is not configured.')}</p>}
      <p className="text-xs leading-5 text-zinc-400">{t('One GPU job runs at a time. Completed analyses are saved; you can explicitly request a new analysis. New categories are only created when you accept them.')}</p>
    </section>
    <label className="block text-sm text-zinc-300">{t('Search videos')}<input type="search" value={input} onChange={event => setInput(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white" /></label>
    {(error || loadError) && <p role="alert" className="text-red-300">{error || t('Analysis results could not be loaded.')}</p>}
    {!data && !loadError && <output className="block text-zinc-400">{t('Loading...')}</output>}
    {data?.items.length === 0 && <p className="text-sm text-zinc-400">{t('No videos found.')}</p>}
    <div className="space-y-4">{data?.items.map(movie => {
      const analysis = movie.videoAnalyses[0];
      const status = analysis ? analysisStatus(analysis) : '';
      const active = analysisActive(status);
      const finishedLabel = status === 'SUCCEEDED' ? 'Analysis completed' : 'Analysis stopped';
      return <section key={movie.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0"><h2 className="break-words font-semibold text-white">{movie.title}</h2><p className="mt-1 text-xs text-zinc-400">{t(movie.type === 'Serie' ? 'Series' : 'Movie')} · {movie.duration}</p></div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/video-analysis/${encodeURIComponent(movie.id)}/examples`} className="inline-flex min-h-10 items-center rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">{t('Mark video segments')}</Link>
            {analysis?.jobRun && ['FAILED', 'DEAD_LETTER'].includes(status) && <Button type="button" disabled={pending || !data.model.available} onClick={() => { void request(`/api/admin/jobs/${analysis.jobRun!.id}`, 'POST'); }}>{t('Resume analysis')}</Button>}
            <Button type="button" disabled={pending || active || !data.model.available} onClick={() => { void request('/api/admin/video-analysis', 'POST', { movieId: movie.id, force: Boolean(analysis) }); }} className="bg-red-600 text-white hover:bg-red-500">{t(analysis ? 'Analyze again' : 'Analyze video')}</Button>
            {analysis?.jobRun && active && <Button type="button" disabled={pending || status === 'CANCEL_REQUESTED'} onClick={() => { void request(`/api/admin/jobs/${analysis.jobRun!.id}`, 'DELETE'); }}>{t('Cancel')}</Button>}
            {analysis && !active && <Button type="button" onClick={() => setExpanded(current => current === movie.id ? null : movie.id)}>{t('Review suggestions')}</Button>}
          </div>
        </div>
        {analysis && <div className="mt-4 text-sm text-zinc-300">
          <output>{t(active ? 'Analysis in progress' : finishedLabel)} · {analysis.processedCount}/{analysis.sampleCount} {t('video segments')}</output>
          {active && <progress aria-label={t('Analysis progress')} value={analysis.jobRun?.progress ?? 0} max={100} className="mt-3 block h-2 w-full accent-red-500" />}
          {analysis.errorCode && <p className="mt-2 text-red-300">{t(analysisErrorKey(analysis.errorCode))}</p>}
        </div>}
        {analysis && expanded === movie.id && <VideoAnalysisReview key={analysis.id} analysisId={analysis.id} movieId={movie.id} onReviewed={() => { void mutate(undefined, { throwOnError: false }); }} />}
      </section>;
    })}</div>
    {data && data.totalPages > 1 && <div className="flex items-center justify-between gap-3"><Button type="button" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>{t('Previous page')}</Button><span className="text-sm text-zinc-400">{page}/{data.totalPages}</span><Button type="button" disabled={page >= data.totalPages} onClick={() => setPage(current => current + 1)}>{t('Next page')}</Button></div>}
  </div>;
}
