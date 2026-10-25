"use client";

import { useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import fetcher from '@/lib/fetcher';
import type { TranslationKey } from '@/lib/i18n/translations';
import { categoryLabel } from '@/lib/category-label';

export type AnalysisSummary = { id: string; status: string; samplingProfile?: string; processedCount: number; sampleCount: number; errorCode: string | null; jobRun: { id: string; status: string; progress: number } | null };
export type AnalysisSuggestion = { id: string; name: string; nameEn?: string; confidence: number; evidence: number[]; state: string; categoryId: string | null; category: { name: string; nameEn?: string } | null };
type Detail = AnalysisSummary & { suggestions: AnalysisSuggestion[] };

const errors: Record<string, TranslationKey> = {
  MODEL_UNAVAILABLE: 'The analysis model service is not ready.',
  INVALID_MODEL_CONFIGURATION: 'The model service configuration is invalid.',
  MODEL_ACCESS_DENIED: 'The model service denied access. Check its API credentials.',
  ANALYSIS_DISABLED: 'Video analysis is not configured.',
  VIDEO_CHANGED: 'The video has changed. Start a new analysis.',
  VIDEO_NOT_FOUND: 'The video file could not be found.',
  MODEL_RESPONSE_INVALID: 'The model did not return usable categories. You can try again.',
  FRAME_CAPTURE_FAILED: 'A video segment could not be read.',
  ADMIN_ACCESS_LOST: 'Administrator access is no longer available.',
  TOO_MANY_CATEGORIES: 'A title can have at most 50 categories.',
  QUEUE_UNAVAILABLE: 'The analysis queue is temporarily unavailable.',
  ANALYSIS_CANCELLED: 'Analysis cancelled.',
  MISSING_CATEGORY_TRANSLATION: 'Both category languages are required. Start a new analysis.',
  ANALYSIS_PROFILE_CHANGED: 'Analysis settings have changed. Start a new analysis.',
  INVALID_SAMPLING_PROFILE: 'The sampling profile is unavailable. Start a new analysis.',
  CATEGORY_NOT_AVAILABLE: 'This category no longer exists. Start a new analysis.',
  NO_ANALYSIS_CATEGORIES: 'Create categories before analyzing videos.',
  TOO_MANY_ANALYSIS_CATEGORIES: 'Video analysis supports up to 1024 existing categories.',
};
export function analysisErrorKey(code?: string | null): TranslationKey { return errors[code ?? ''] ?? 'Video analysis could not be completed.'; }
export function analysisStatus(analysis: Pick<AnalysisSummary, 'status' | 'jobRun'>) { return analysis.jobRun?.status ?? analysis.status; }
export function analysisActive(status: string) { return ['QUEUED', 'RUNNING', 'CANCEL_REQUESTED'].includes(status); }

function evidenceTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, '0')}`;
}

export function VideoAnalysisReview({ analysisId, movieId, onReviewed }: Readonly<{ analysisId: string; movieId: string; onReviewed: () => void }>) {
  const { t, locale } = useLanguage();
  const { data, error, mutate: refresh } = useSWR<Detail>(`/api/admin/video-analysis/${analysisId}`, fetcher, { refreshInterval: 3000 });
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const requestedTime = useRef(0);
  const ready = data && analysisStatus(data) === 'SUCCEEDED';
  const existingSuggestions = (data?.suggestions ?? []).filter(suggestion => suggestion.categoryId && suggestion.category);

  function viewEvidence(seconds: number) {
    requestedTime.current = seconds;
    setShowVideo(true);
    if (video.current?.readyState) { video.current.pause(); video.current.currentTime = seconds; }
  }
  async function review(action: 'ACCEPT' | 'REJECT') {
    if (pending || selected.length === 0) return;
    setPending(true);
    setFailure('');
    try {
      const response = await fetch(`/api/admin/video-analysis/${analysisId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected, action }) });
      const result = await response.json();
      if (!response.ok) { setFailure(t(analysisErrorKey(result.error))); return; }
      setSelected([]);
      await refresh(undefined, { throwOnError: false });
      await mutate('/api/categories', undefined, { revalidate: true, throwOnError: false });
      await mutate(`/api/movies/${movieId}`, undefined, { revalidate: true, throwOnError: false });
      onReviewed();
    } catch { setFailure(t('Video analysis could not be completed.')); }
    finally { setPending(false); }
  }

  if (error) return <p role="alert" className="mt-4 text-red-300">{t('Analysis results could not be loaded.')}</p>;
  if (!data) return <output className="mt-4 block text-zinc-400">{t('Loading...')}</output>;
  return (
    <div className="mt-5 space-y-4 border-t border-zinc-700 pt-5">
      <p className="text-xs leading-5 text-zinc-400">{t('Visual samples cover the full timeline; audio is not analyzed. Model scores are estimates, not guarantees. Check the evidence before accepting.')}</p>
      {showVideo && <div className="space-y-2">
        <video ref={video} controls preload="metadata" aria-label={t('Review video segment')} src={`/api/video/${encodeURIComponent(movieId)}`} onLoadedMetadata={() => { if (video.current) video.current.currentTime = requestedTime.current; }} className="aspect-video max-h-80 w-full rounded-lg bg-black">
          <track kind="captions" />
        </video>
        <Button type="button" onClick={() => setShowVideo(false)}>{t('Close preview')}</Button>
      </div>}
      {ready && existingSuggestions.length === 0 && <p className="text-sm text-zinc-300">{t('No usable category suggestions were found.')}</p>}
      {ready && existingSuggestions.length > 0 && <>
        <Button type="button" disabled={pending} onClick={() => setSelected(existingSuggestions.filter(item => item.state === 'PENDING').map(item => item.id))}>{t('Select all suggestions')}</Button>
        <ul className="space-y-3">
          {existingSuggestions.map(suggestion => <li key={suggestion.id} className="rounded-lg border border-zinc-700 p-3">
            <label className="flex items-center gap-3 text-sm text-white">
              <input type="checkbox" disabled={pending || suggestion.state !== 'PENDING'} checked={selected.includes(suggestion.id)} onChange={event => setSelected(current => event.target.checked ? [...current, suggestion.id] : current.filter(id => id !== suggestion.id))} />
              <span className="font-medium">{categoryLabel(suggestion.category ?? suggestion, locale)}</span>
              <span className="text-xs text-zinc-400">{t('Existing category')}</span>
              <span className="ml-auto text-xs text-zinc-400">{t('Model score')}: {Math.round(suggestion.confidence * 100)}%</span>
            </label>
            <p className="mt-2 text-xs text-zinc-400">DE: {suggestion.category?.name ?? suggestion.name} · EN: {suggestion.category?.nameEn || suggestion.nameEn || '—'}</p>
            {suggestion.state !== 'PENDING' && <p className="mt-2 text-xs text-zinc-400">{t(suggestion.state === 'ACCEPTED' ? 'Accepted' : 'Rejected')}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestion.evidence.filter(value => typeof value === 'number' && Number.isFinite(value)).slice(0, 8).map(seconds => <button key={seconds} type="button" aria-label={`${t('View segment')}: ${evidenceTime(seconds)}`} onClick={() => viewEvidence(seconds)} className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-200 hover:bg-zinc-700">{evidenceTime(seconds)}</button>)}
            </div>
          </li>)}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={pending || selected.length === 0} onClick={() => { void review('ACCEPT'); }} className="bg-red-600 text-white hover:bg-red-500">{t('Accept and assign categories')}</Button>
          <Button type="button" disabled={pending || selected.length === 0} onClick={() => { void review('REJECT'); }}>{t('Reject suggestions')}</Button>
        </div>
      </>}
      {failure && <p role="alert" className="text-sm text-red-300">{failure}</p>}
    </div>
  );
}
