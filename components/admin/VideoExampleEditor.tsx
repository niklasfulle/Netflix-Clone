"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { PlayerButton } from '@/components/player/PlayerControls';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCategories } from '@/hooks/useCategories';
import { categoryLabel } from '@/lib/category-label';
import type { CategorySummary } from '@/lib/category-validation';
import { InlineCategoryCreator } from '@/components/admin/InlineCategoryCreator';
import fetcher from '@/lib/fetcher';
import { formatExampleTime, parseExampleTime, type ExampleVerdict, type VideoExampleDto, type VideoExamplesDto } from '@/lib/video-examples/types';
import type { TranslationKey } from '@/lib/i18n/translations';

const errorKeys: Record<string, TranslationKey> = {
  VIDEO_CHANGED: 'Source video changed. Reload this page.',
  EXAMPLE_CONFLICT: 'Example changed. Reload before editing.',
  INVALID_TIME_RANGE: 'Time range must be within the video.',
  INVALID_CATEGORY: 'Categories changed. Reload this page.',
  EXAMPLE_LIMIT: 'This video already has 500 examples.',
};
const verdictKeys: Record<ExampleVerdict, TranslationKey> = {
  PRESENT: 'Present in this segment', ABSENT: 'Absent from this segment', UNCERTAIN: 'Uncertain in this segment',
};

export function VideoExampleEditor({ movieId }: Readonly<{ movieId: string }>) {
  const { t, locale } = useLanguage();
  const { data, error: loadError, mutate } = useSWR<VideoExamplesDto>(`/api/admin/video-examples?movieId=${encodeURIComponent(movieId)}`, fetcher);
  const { categories, error: categoriesError, isLoading: categoriesLoading, refresh: refreshCategories } = useCategories();
  const [createdCategories, setCreatedCategories] = useState<CategorySummary[]>([]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const [originalFingerprint, setOriginalFingerprint] = useState('');
  const requestId = useRef('');
  const [startText, setStartText] = useState('00:00:00.000');
  const [endText, setEndText] = useState('00:00:10.000');
  const [time, setTime] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [loop, setLoop] = useState(false);
  const [labels, setLabels] = useState<Record<string, ExampleVerdict>>({});
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState<VideoExampleDto | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const start = parseExampleTime(startText);
  const end = parseExampleTime(endText);
  const duration = data?.durationSeconds ?? 0;
  const sourceChanged = Boolean(data && originalFingerprint && data.sourceFingerprint !== originalFingerprint);
  const validRange = Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start && end <= duration;

  useEffect(() => {
    if (data && !originalFingerprint) {
      setOriginalFingerprint(data.sourceFingerprint);
      setEndText(formatExampleTime(Math.min(10, data.durationSeconds)));
    }
  }, [data, originalFingerprint]);

  function seek(seconds: number) {
    if (!video.current || !ready) return;
    video.current.currentTime = Math.max(0, Math.min(duration, seconds));
    setTime(video.current.currentTime);
  }
  async function play() {
    try { await video.current?.play(); }
    catch { setFailure(t('The video could not be played.')); }
  }
  function resetDraft() {
    setEditing(null); setLabels({}); setNote(''); requestId.current = '';
    setPreviewing(false); setDeleting(null);
  }
  function edit(example: VideoExampleDto) {
    video.current?.pause(); setPreviewing(false); setEditing(example);
    setStartText(formatExampleTime(example.startSeconds)); setEndText(formatExampleTime(example.endSeconds));
    setLabels(Object.fromEntries(example.labels.map(label => [label.categoryId, label.verdict])));
    setNote(example.note); setFailure(''); setNotice(''); seek(example.startSeconds);
  }
  async function save() {
    if (pending) return;
    if (!validRange) { setFailure(t('Time range must be within the video.')); return; }
    if (!Object.keys(labels).length) { setFailure(t('Select at least one category verdict.')); return; }
    if (sourceChanged || !data) return;
    setPending(true); setFailure(''); setNotice('');
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const body = { movieId, sourceFingerprint: originalFingerprint, startSeconds: start, endSeconds: end,
        labels: Object.entries(labels).map(([categoryId, verdict]) => ({ categoryId, verdict })), note,
        ...(editing ? { id: editing.id, version: editing.version } : { requestId: requestId.current }) };
      const response = await fetch('/api/admin/video-examples', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) { setFailure(t(errorKeys[result.error] ?? 'Example could not be saved.')); return; }
      resetDraft(); setNotice(t('Example saved.')); await mutate(undefined, { throwOnError: false });
    } catch { setFailure(t('Example could not be saved.')); }
    finally { setPending(false); }
  }
  async function remove(example: VideoExampleDto) {
    setPending(true); setFailure(''); setNotice('');
    try {
      const response = await fetch('/api/admin/video-examples', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: example.id, version: example.version }) });
      const result = await response.json();
      if (!response.ok) { setFailure(t(errorKeys[result.error] ?? 'Example could not be saved.')); return; }
      if (editing?.id === example.id) resetDraft();
      setDeleting(null); setNotice(t('Example deleted.')); await mutate(undefined, { throwOnError: false });
    } catch { setFailure(t('Example could not be saved.')); }
    finally { setPending(false); }
  }
  function exportExamples() {
    if (!data) return;
    const exported = { schemaVersion: 1, groupKey: movieId, movie: data.movie, sourceFingerprint: data.sourceFingerprint, examples: data.examples.filter(example => !example.stale) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `video-examples-${movieId}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const available = [...categories, ...createdCategories.filter(created => !categories.some(category => category.id === created.id))];
  for (const label of editing?.labels ?? []) if (!available.some(category => category.id === label.categoryId)) available.push({ id: label.categoryId, name: label.name, nameEn: label.nameEn, contentCount: 0 });
  const visibleCategories = available.filter(category => `${category.name} ${category.nameEn ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()));

  return <div className="space-y-6">
    <AdminPageHeader title={t('Video examples')} description={data?.movie.title ?? t('Loading...')} actions={<Link href="/admin/video-analysis" className="text-sm text-zinc-300 underline">{t('Video analysis')}</Link>} />
    {(failure || loadError || categoriesError || sourceChanged) && <div role="alert" className="rounded-lg border border-red-500/40 p-4 text-red-200">{failure || t(sourceChanged ? 'Source video changed. Reload this page.' : 'Examples could not be loaded.')}<Button type="button" className="ml-3" onClick={() => location.reload()}>{t('Reload')}</Button></div>}
    {notice && <output className="block text-emerald-300">{notice}</output>}
    {!data && !loadError && <output>{t('Loading...')}</output>}
    {data && <>
      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
        <video ref={video} src={`/api/video/${encodeURIComponent(movieId)}`} preload="metadata" muted={muted} aria-label={t('Video example player')} className="aspect-video max-h-[55vh] w-full"
          onLoadedMetadata={() => setReady(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setReady(false); setFailure(t('The video could not be played.')); }}
          onTimeUpdate={() => {
            const element = video.current; if (!element) return;
            if (previewing && validRange && element.currentTime >= end) {
              if (loop) element.currentTime = start;
              else { element.pause(); element.currentTime = end; setPreviewing(false); }
            }
            setTime(element.currentTime);
          }}><track kind="captions" /></video>
        <div className="space-y-2 bg-zinc-950 p-4">
          <div aria-label={t('Marked segments')} className="relative h-5 overflow-hidden rounded bg-zinc-800">
            {data.examples.filter(example => !example.stale).map(example => <button key={example.id} type="button" disabled={pending} title={`${formatExampleTime(example.startSeconds)} – ${formatExampleTime(example.endSeconds)}`} aria-label={`${t('Edit example')}: ${formatExampleTime(example.startSeconds)}`} onClick={() => edit(example)} className="absolute inset-y-0 border border-emerald-400 bg-emerald-700/70 focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" style={{ left: `${example.startSeconds / duration * 100}%`, width: `${Math.max(0.5, (example.endSeconds - example.startSeconds) / duration * 100)}%` }} />)}
            {validRange && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 border-2 border-red-400 bg-red-500/30" style={{ left: `${start / duration * 100}%`, width: `${(end - start) / duration * 100}%` }} />}
          </div>
          <input type="range" aria-label={t('Seek')} aria-valuetext={formatExampleTime(time)} min={0} max={duration} step={0.05} value={Math.min(time, duration)} disabled={!ready} onChange={event => { setPreviewing(false); seek(Number(event.target.value)); }} className="h-7 w-full accent-red-500" />
          <div className="flex flex-wrap items-center gap-2 text-white">
            <PlayerButton label={t(playing ? 'Pause' : 'Play')} disabled={!ready} onClick={() => { setPreviewing(false); if (playing) video.current?.pause(); else void play(); }}>{playing ? <Pause /> : <Play />}</PlayerButton>
            <PlayerButton label={t('Back 1 second')} disabled={!ready} onClick={() => seek(time - 1)}><RotateCcw /></PlayerButton>
            <PlayerButton label={t('Forward 1 second')} disabled={!ready} onClick={() => seek(time + 1)}><RotateCw /></PlayerButton>
            <output className="mr-auto font-mono text-xs">{formatExampleTime(time)} / {formatExampleTime(duration)}</output>
            <PlayerButton label={t(muted ? 'Unmute' : 'Mute')} onClick={() => setMuted(current => !current)}>{muted ? <VolumeX /> : <Volume2 />}</PlayerButton>
            <select aria-label={t('Playback speed')} defaultValue="1" onChange={event => { if (video.current) video.current.playbackRate = Number(event.target.value); }} className="h-10 rounded border border-zinc-700 bg-zinc-900 px-2">{[0.25, 0.5, 0.75, 1, 1.5, 2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select>
          </div>
        </div>
      </section>
      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="font-semibold">{t(editing ? 'Edit example' : 'Mark video segments')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">{(['start', 'end'] as const).map(kind => <div key={kind} className="space-y-2">
          <label className="block text-sm text-zinc-300">{t(kind === 'start' ? 'Start time' : 'End time')}<input type="text" inputMode="decimal" value={kind === 'start' ? startText : endText} disabled={pending} onChange={event => { setPreviewing(false); if (kind === 'start') setStartText(event.target.value); else setEndText(event.target.value); }} className="mt-2 h-11 w-full rounded border border-zinc-700 bg-zinc-950 px-3 font-mono" /></label>
          <Button type="button" disabled={!ready || pending} onClick={() => { setPreviewing(false); if (kind === 'start') setStartText(formatExampleTime(time)); else setEndText(formatExampleTime(time)); }}>{t(kind === 'start' ? 'Set start here' : 'Set end here')}</Button>
        </div>)}</div>
        <div className="flex flex-wrap items-center gap-4"><Button type="button" disabled={!ready || !validRange} onClick={() => { seek(start); setPreviewing(true); void play(); }}>{t('Play selection')}</Button><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={loop} onChange={event => setLoop(event.target.checked)} />{t('Loop selection')}</label></div>
        {!validRange && <p className="text-sm text-amber-300">{t('Time range must be within the video.')}</p>}
        <p className="text-sm text-zinc-400">{t('Unrated categories are not negative examples.')}</p>
        <label className="block text-sm">{t('Search categories')}<input type="search" value={search} disabled={pending || creatingCategory} onChange={event => setSearch(event.target.value)} className="mt-2 h-10 w-full rounded border border-zinc-700 bg-zinc-950 px-3" /></label>
        <p className="text-xs text-zinc-400">{t('Searching does not select or create a category.')}</p>
        {categoriesLoading && <output className="block text-sm text-zinc-400">{t('Loading categories...')}</output>}
        {!categoriesLoading && !categoriesError && visibleCategories.length === 0 && <p className="text-sm text-amber-300">{t('No categories found.')}</p>}
        {!categoriesLoading && !categoriesError && visibleCategories.length === 0 && search.trim() && <InlineCategoryCreator key={`${locale}:${search.trim()}`} suggestedName={search.trim()} disabled={pending} onBusyChange={setCreatingCategory} onCreated={async (category, verdict) => {
          setCreatedCategories(current => [...current.filter(value => value.id !== category.id), category]);
          setLabels(current => ({ ...current, [category.id]: verdict })); setSearch(''); setFailure('');
          setNotice(t(verdict === 'PRESENT' ? 'Category created and marked as present.' : 'Category created and rated.'));
          await refreshCategories(undefined, { throwOnError: false });
        }} />}
        <div className="max-h-80 space-y-2 overflow-y-auto">{visibleCategories.map(category => <label key={category.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-zinc-700 p-3 text-sm"><span>{categoryLabel(category, locale)}</span><select aria-label={`${t('Category verdict')}: ${categoryLabel(category, locale)}`} disabled={pending} value={labels[category.id] ?? ''} onChange={event => setLabels(current => { const next = { ...current }; if (event.target.value) next[category.id] = event.target.value as ExampleVerdict; else delete next[category.id]; return next; })} className="h-10 rounded border border-zinc-600 bg-zinc-950 px-2"><option value="">{t('Not rated')}</option>{(Object.keys(verdictKeys) as ExampleVerdict[]).map(verdict => <option key={verdict} value={verdict}>{t(verdictKeys[verdict])}</option>)}</select></label>)}</div>
        {!available.length && <Link href="/admin/categories" className="block text-sm underline">{t('Manage categories')}</Link>}
        <button type="button" disabled={pending || creatingCategory || categoriesLoading} onClick={() => { void refreshCategories(undefined, { throwOnError: false }); }} className="text-xs text-zinc-300 underline disabled:opacity-50">{t('Refresh categories')}</button>
        {Object.keys(labels).length > 0 && <div className="space-y-2"><p className="text-sm font-medium">{t('Rated categories')}: {Object.keys(labels).length}</p><ul aria-label={t('Rated categories')} className="flex flex-wrap gap-2">{Object.entries(labels).map(([id, verdict]) => { const category = available.find(value => value.id === id); return category ? <li key={id} className="rounded border border-zinc-600 px-2 py-1 text-xs">{categoryLabel(category, locale)} · {t(verdictKeys[verdict])}</li> : null; })}</ul></div>}
        <label className="block text-sm">{t('Segment note')}<textarea value={note} maxLength={500} disabled={pending} onChange={event => setNote(event.target.value)} className="mt-2 min-h-20 w-full rounded border border-zinc-700 bg-zinc-950 p-3" /></label>
        {!Object.keys(labels).length && <p role="status" className="text-sm text-amber-300">{t('Select at least one category verdict.')}</p>}
        <div className="flex flex-wrap gap-3"><Button type="button" disabled={pending || creatingCategory || categoriesLoading || !validRange || !Object.keys(labels).length || sourceChanged || Boolean(loadError || categoriesError) || Boolean(editing?.stale)} onClick={() => { void save(); }} className="bg-red-600 text-white hover:bg-red-500">{t(editing ? 'Update example' : 'Save example')}</Button><Button type="button" disabled={pending || creatingCategory} onClick={resetDraft}>{t('Clear selection')}</Button></div>
      </section>
      <section className="space-y-3 rounded-xl border border-zinc-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{t('Saved examples')} ({data.examples.length})</h2><Button type="button" disabled={!data.examples.some(example => !example.stale) || sourceChanged} onClick={exportExamples}>{t('Export examples')}</Button></div>
        <p className="text-xs text-zinc-400">{t('Keep all examples from one video in the same dataset group. Uncertain labels require review before training.')}</p>
        {!data.examples.length && <p className="text-sm text-zinc-400">{t('No video examples yet.')}</p>}
        {data.examples.map(example => <article key={example.id} className="space-y-3 rounded-lg border border-zinc-700 p-4">
          <p className="font-mono text-sm">{formatExampleTime(example.startSeconds)} – {formatExampleTime(example.endSeconds)}</p>
          {example.stale && <p className="text-sm text-amber-300">{t('This example belongs to an older video file.')}</p>}
          <ul className="flex flex-wrap gap-2">{example.labels.map(label => <li key={label.categoryId} className={`rounded px-2 py-1 text-xs ${label.verdict === 'PRESENT' ? 'bg-emerald-900 text-emerald-100' : label.verdict === 'ABSENT' ? 'bg-red-950 text-red-200' : 'bg-amber-950 text-amber-200'}`}>{categoryLabel(label, locale)} · {t(verdictKeys[label.verdict])}</li>)}</ul>
          {example.note && <p className="whitespace-pre-wrap break-words text-sm text-zinc-400">{example.note}</p>}
          <div className="flex gap-3"><Button type="button" disabled={pending || example.stale || sourceChanged} onClick={() => edit(example)}>{t('Edit example')}</Button><Button type="button" disabled={pending} onClick={() => setDeleting(example.id)}>{t('Delete')}</Button></div>
          {deleting === example.id && <div className="flex flex-wrap items-center gap-3"><span className="text-sm">{t('Delete this example?')}</span><Button type="button" disabled={pending} onClick={() => { void remove(example); }}>{t('Delete example')}</Button><Button type="button" disabled={pending} onClick={() => setDeleting(null)}>{t('Cancel')}</Button></div>}
        </article>)}
      </section>
    </>}
  </div>;
}
