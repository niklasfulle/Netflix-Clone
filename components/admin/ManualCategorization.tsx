'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookmarkCheck, LoaderCircle, Plus, Shuffle, Tags, Trash2 } from 'lucide-react';
import { CategorySelect } from '@/components/CategorySelect';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useLanguage } from '@/components/providers/LanguageProvider';
import VideoPlayer, { type PlayerHandle } from '@/components/player/VideoPlayer';
import { useCategories } from '@/hooks/useCategories';
import { categoryLabel } from '@/lib/category-label';
import { formatCategoryTime, parseCategoryTime, type CategorizationMovie, type CategorizationResponse, type CategorySegment } from '@/lib/manual-categorization/types';
import type { CategorizationInput } from '@/lib/manual-categorization/validation';
import type { Locale, TranslationKey } from '@/lib/i18n/translations';

async function requestData(url: string, options?: RequestInit): Promise<CategorizationResponse> {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'SAVE_FAILED');
  return body;
}
const errorKeys: Record<string, TranslationKey> = {
  CONFLICT: 'Categories changed elsewhere. Reload this video before saving.',
  INVALID_CATEGORIES: 'A selected category no longer exists. Refresh the categories.',
  VIDEO_UNAVAILABLE: 'The video could not be read. Try again or skip this video.',
  INVALID_RANGE: 'Choose a valid interval within the video duration.',
  INVALID_INPUT: 'Check the selected categories and time intervals.',
  FORBIDDEN: 'Administrator access required.',
};
function message(error: unknown): TranslationKey { return errorKeys[error instanceof Error ? error.message : ''] ?? 'Categories could not be saved.'; }
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40';

export function ManualCategorization({ initialMovieId }: Readonly<{ initialMovieId?: string }>) {
  const { t } = useLanguage();
  const [data, setData] = useState<CategorizationResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<TranslationKey>();
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    const query = new URLSearchParams();
    if (initialMovieId) query.set('movieId', initialMovieId);
    const queryString = query.toString();
    const url = queryString ? `/api/admin/video-analysis?${queryString}` : '/api/admin/video-analysis';
    requestData(url, { signal: abort.signal })
      .then(setData).catch(error_ => { if (!abort.signal.aborted) setError(message(error_)); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [initialMovieId]);
  async function load(movieId?: string, exclude?: string) {
    setLoading(true); setError(undefined);
    const query = new URLSearchParams();
    if (movieId) query.set('movieId', movieId);
    else if (exclude) query.set('exclude', exclude);
    try { setData(await requestData(`/api/admin/video-analysis?${query}`)); setReloadKey(key => key + 1); }
    catch (error_) { setError(message(error_)); }
    finally { setLoading(false); }
  }
  async function save(input: CategorizationInput) {
    const result = await requestData('/api/admin/video-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    setData(result);
    if (input.complete) await load(undefined, input.movieId);
  }
  return <div className="space-y-6">
    <AdminPageHeader title={t('Video analysis')} description={t('Categorize videos manually. Assign categories to the whole video or to specific time intervals.')} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
      <span className="inline-flex items-center gap-2"><Tags aria-hidden="true" className="h-4 w-4 text-red-400" />{t('Videos without categories')}: <strong>{data?.remaining ?? '—'}</strong></span>
      <Link href="/admin/categories" target="_blank" rel="noopener noreferrer" className="text-red-300 underline">{t('Manage categories')}</Link>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{t(error)} <button type="button" className="ml-3 underline" onClick={() => { void load(data?.movie?.id); }}>{t('Retry')}</button></div>}
    {loading && <output className="flex min-h-64 items-center justify-center gap-3 text-zinc-400"><LoaderCircle aria-hidden="true" className="h-6 w-6 animate-spin" />{t('Loading...')}</output>}
    {!loading && data?.movie && <CategorizationEditor key={`${data.movie.id}-${reloadKey}`} movie={data.movie} onSave={save} onSkip={() => load(undefined, data.movie?.id)} onReload={() => load(data.movie?.id)} />}
    {!loading && !data?.movie && !error && <section className="rounded-2xl border border-zinc-800 p-10 text-center"><BookmarkCheck aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-emerald-400" /><h2 className="text-lg font-semibold text-white">{t('No uncategorized videos remain.')}</h2><p className="mt-2 text-sm text-zinc-400">{t('You can reopen any video from content management to edit its categories.')}</p><button type="button" className={`${buttonClass} mt-5`} onClick={() => { void load(); }}>{t('Refresh')}</button></section>}
  </div>;
}

function snapshot(ids: string[], segments: CategorySegment[]) {
  return JSON.stringify({ ids: [...ids].sort((a, b) => a.localeCompare(b)), segments: segments.map(({ categoryId, startSeconds, endSeconds }) => [categoryId, startSeconds, endSeconds]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) });
}

function CategoryIntervalRow({ segment, pending, locale, onSeek, onEdit, onRemove }: Readonly<{
  segment: CategorySegment; pending: boolean; locale: Locale;
  onSeek: () => void; onEdit: () => void; onRemove: () => void;
}>) {
  const { t } = useLanguage();
  return <li className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-black/20 p-3">
    <button type="button" className="min-w-0 flex-1 text-left text-sm text-zinc-200 hover:text-red-300" onClick={onSeek}>
      <span className="block break-words font-medium">{categoryLabel(segment.category, locale)}</span>
      <span className="font-mono text-xs text-zinc-400">{formatCategoryTime(segment.startSeconds)} – {formatCategoryTime(segment.endSeconds)}</span>
    </button>
    <button type="button" disabled={pending} className={buttonClass} onClick={onEdit}>{t('Edit')}</button>
    <button type="button" disabled={pending} aria-label={`${t('Remove interval')} ${categoryLabel(segment.category, locale)}`} className={buttonClass} onClick={onRemove}><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
  </li>;
}

function CategorizationEditor({ movie, onSave, onSkip, onReload }: Readonly<{
  movie: CategorizationMovie;
  onSave: (input: CategorizationInput) => Promise<void>;
  onSkip: () => Promise<void>;
  onReload: () => Promise<void>;
}>) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { categories } = useCategories();
  const player = useRef<PlayerHandle>(null);
  const [categoryIds, setCategoryIds] = useState(movie.categories.map(category => category.id));
  const [segments, setSegments] = useState(movie.segments);
  const [selected, setSelected] = useState<string[]>([]);
  const [start, setStart] = useState('00:00:00.000');
  const [end, setEnd] = useState('00:00:00.000');
  const [position, setPosition] = useState({ time: 0, duration: 0 });
  const [editing, setEditing] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<TranslationKey>();
  const [saved, setSaved] = useState(false);
  const dirty = snapshot(categoryIds, segments) !== snapshot(movie.categories.map(category => category.id), movie.segments);
  const unfinished = selected.length > 0 || editing !== null;
  const changed = dirty || unfinished;
  const positionChanged = useCallback((time: number, duration: number) => setPosition({ time, duration }), []);
  useEffect(() => {
    if (!changed) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    globalThis.addEventListener('beforeunload', warn);
    return () => globalThis.removeEventListener('beforeunload', warn);
  }, [changed]);
  const leave = () => !changed || globalThis.confirm(t('Discard unsaved category changes?'));
  const startSeconds = parseCategoryTime(start);
  const endSeconds = parseCategoryTime(end);
  const rangeValid = startSeconds !== null && endSeconds !== null && endSeconds > startSeconds && endSeconds <= position.duration;
  function resetRange() { setSelected([]); setEditing(null); }
  function applyRange() {
    if (!rangeValid || startSeconds === null || endSeconds === null || !selected.length) return;
    const additions = selected.map(id => categories.find(category => category.id === id)).filter(category => category !== undefined)
      .map(category => ({ categoryId: category.id, category, startSeconds, endSeconds }));
    if (additions.length !== selected.length) { setError(errorKeys.INVALID_CATEGORIES); return; }
    const next = [...segments.filter((_, index) => index !== editing), ...additions];
    const unique = new Map(next.map(segment => [`${segment.categoryId}:${segment.startSeconds}:${segment.endSeconds}`, segment]));
    if (unique.size > 200) { setError('A video can have at most 200 category intervals.'); return; }
    setSegments([...unique.values()].sort((a, b) => a.startSeconds - b.startSeconds)); resetRange(); setSaved(false);
  }
  async function save(complete: boolean) {
    if (unfinished) { setError('Add or discard the current interval before saving.'); return; }
    setPending(true); setError(undefined); setSaved(false);
    try { await onSave({ movieId: movie.id, version: movie.version, categoryIds, segments: segments.map(({ categoryId, startSeconds, endSeconds }) => ({ categoryId, startSeconds, endSeconds })), complete }); setSaved(true); }
    catch (error_) { setError(message(error_)); }
    finally { setPending(false); }
  }
  function editSegment(segment: CategorySegment, index: number) {
    if (unfinished && !globalThis.confirm(t('Discard the current interval draft?'))) return;
    setStart(formatCategoryTime(segment.startSeconds));
    setEnd(formatCategoryTime(segment.endSeconds));
    setSelected([segment.categoryId]);
    setEditing(index);
    player.current?.seek(segment.startSeconds);
  }
  function removeSegment(index: number) {
    setSegments(current => current.filter((_, currentIndex) => currentIndex !== index));
    resetRange();
    setSaved(false);
  }
  const activeCategories = categoryIds.map(id => categories.find(category => category.id === id) ?? movie.categories.find(category => category.id === id)).filter(category => category !== undefined);
  return <div className="space-y-6" aria-busy={pending}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-widest text-red-400">{t(movie.type === 'Serie' ? 'Series' : 'Movie')} · {t('Manual categorization')}</p><h2 className="mt-1 break-words text-xl font-semibold text-white">{movie.title}</h2></div><button type="button" disabled={pending} className={buttonClass} onClick={() => { if (leave()) void onSkip(); }}><Shuffle aria-hidden="true" className="h-4 w-4" />{t('Skip video')}</button></div>
    <VideoPlayer items={[{ id: movie.id, title: movie.title, categories: activeCategories, categorySegments: segments }]} mode="categorize" playbackRef={player} onPositionChange={positionChanged} onBack={() => { if (leave()) router.push('/admin/movies'); }} />
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6" aria-label={t('Video categories')}>
      <div><h3 className="font-semibold text-white">{t('Video categories')}</h3><p className="mt-1 text-sm text-zinc-400">{t('These categories apply to the entire video and appear in its details.')}</p></div>
      <CategorySelect value={categoryIds} onChange={ids => { setCategoryIds(ids); setSaved(false); }} disabled={pending} />
      {categoryIds.length > 50 && <p role="alert" className="text-sm text-red-300">{t('A title can have at most 50 categories.')}</p>}
    </section>
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6" aria-label={t('Category intervals')}>
      <div><h3 className="font-semibold text-white">{t('Category intervals')}</h3><p className="mt-1 text-sm text-zinc-400">{t('Mark a start and end, then select categories. These ranges appear on the player timeline.')}</p></div>
      <div className="grid gap-4 sm:grid-cols-2">{([{ label: 'Start time', value: start, set: setStart, action: 'Set start here' }, { label: 'End time', value: end, set: setEnd, action: 'Set end here' }] as const).map(field => <div key={field.label} className="space-y-2"><label className="block text-sm text-zinc-300">{t(field.label)}<input value={field.value} onChange={event => field.set(event.target.value)} disabled={pending} spellCheck={false} placeholder="00:00:00.000" className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 font-mono text-sm text-white focus-visible:outline-red-400" /></label><button type="button" disabled={pending || !position.duration} className={buttonClass} onClick={() => field.set(formatCategoryTime(position.time))}>{t(field.action)}</button></div>)}</div>
      <p className="text-xs text-zinc-500">{t('Enter seconds or HH:MM:SS.mmm. Intervals must be within the video duration.')}</p>
      <CategorySelect value={selected} onChange={setSelected} disabled={pending} />
      {selected.length > 0 && !rangeValid && <output className="block text-sm text-amber-200">{t('Choose a valid interval within the video duration.')}</output>}
      <div className="flex flex-wrap gap-2"><button type="button" disabled={pending || !rangeValid || !selected.length} className={buttonClass} onClick={applyRange}><Plus aria-hidden="true" className="h-4 w-4" />{t(editing === null ? 'Add interval' : 'Update interval')}</button>{unfinished && <button type="button" disabled={pending} className={buttonClass} onClick={resetRange}>{t('Discard interval')}</button>}</div>
      {segments.length ? <ol className="max-h-80 space-y-2 overflow-y-auto">{segments.map((segment, index) => <CategoryIntervalRow key={`${segment.categoryId}:${segment.startSeconds}:${segment.endSeconds}`} segment={segment} pending={pending} locale={locale} onSeek={() => player.current?.seek(segment.startSeconds)} onEdit={() => editSegment(segment, index)} onRemove={() => removeSegment(index)} />)}</ol> : <p className="text-sm text-zinc-500">{t('No category intervals yet.')}</p>}
    </section>
    <div className="z-20 space-y-3 rounded-2xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-xl backdrop-blur lg:sticky lg:bottom-0">
      {error && <p role="alert" className="text-sm text-red-300">{t(error)} {error === errorKeys.CONFLICT && <button type="button" className="underline" onClick={() => { if (leave()) void onReload(); }}>{t('Reload video')}</button>}</p>}
      {saved && !changed && <output className="block text-sm text-emerald-300">{t('Categories saved.')}</output>}
      <div className="flex flex-wrap items-center gap-3"><p className="mr-auto text-xs text-zinc-400">{t(changed ? 'Unsaved category changes' : 'Save and next also completes videos without a matching category.')}</p><button type="button" className={buttonClass} disabled={pending || categoryIds.length > 50} onClick={() => { void save(false); }}>{t('Save')}</button><button type="button" className={`${buttonClass} border-red-500/40 bg-red-600 hover:bg-red-500`} disabled={pending || categoryIds.length > 50} onClick={() => { void save(true); }}><BookmarkCheck aria-hidden="true" className="h-4 w-4" />{t(pending ? 'Saving...' : 'Save and next video')}</button></div>
    </div>
  </div>;
}
