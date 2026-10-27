"use client";

import Image from 'next/image';
import { ArrowLeft, Check, ListVideo, LoaderCircle, Play, X } from 'lucide-react';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Ref, RefObject } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import useMovie from '@/hooks/movies/useMovie';
import { usePlayback } from './usePlayback';
import { useRecommendations } from './useRecommendations';
import { EndRecommendations } from './EndRecommendations';
import PlayerControls, { PlayerButton } from './PlayerControls';
import type { PlayerItem } from './types';
import { categoryLabel } from '@/lib/category-label';
import type { CategoryName } from '@/lib/manual-categorization/types';

function VideoCategoryBadges({ categories = [] }: Readonly<{ categories?: CategoryName[] }>) {
  const { t, locale } = useLanguage();
  if (!categories.length) return null;
  return <div aria-label={t('Video categories')} className="flex max-h-20 flex-wrap justify-end gap-1 overflow-y-auto">
    {categories.map(category => <span key={category.id} className="max-w-full break-words rounded-md border border-white/10 bg-black/65 px-2 py-1 text-xs font-medium text-zinc-100 backdrop-blur">{categoryLabel(category, locale)}</span>)}
  </div>;
}

interface PlayerProps {
  items: PlayerItem[];
  playlistTitle?: string;
  startTime?: number;
  onBack: () => void;
  mode?: 'watch' | 'categorize';
  playbackRef?: Ref<PlayerHandle>;
  onPositionChange?: (time: number, duration: number) => void;
}
export type PlayerHandle = { seek: (seconds: number) => void };

export default function VideoPlayer({ items, playlistTitle, startTime, onBack, mode = 'watch', playbackRef, onPositionChange }: Readonly<PlayerProps>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(items[0]?.id);
  const [queueOpen, setQueueOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const index = Math.max(0, items.findIndex(item => item.id === activeId));
  const current = items[index];
  const next = items[index + 1];

  useEffect(() => {
    try { setAutoplay(localStorage.getItem('playerAutoplayNext') !== 'false'); } catch { /* Optional preference. */ }
  }, []);

  const choose = useCallback((id: string) => { setCountdown(null); setActiveId(id); }, []);
  useEffect(() => {
    if (countdown === null || !next) return;
    if (countdown === 0) { choose(next.id); return; }
    const timer = setTimeout(() => setCountdown(value => value === null ? null : value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, next, choose]);

  if (!current) return null;

  return (
    <div ref={rootRef} className={`relative w-full overflow-hidden bg-black text-white ${mode === 'categorize' ? 'rounded-2xl border border-zinc-800' : 'h-dvh'}`}>
      <PlaybackSession key={current.id} item={current} items={items} index={index} playlistTitle={playlistTitle}
        mode={mode} playbackRef={playbackRef} onPositionChange={onPositionChange}
        rootRef={rootRef} startTime={startTime} queueOpen={queueOpen} setQueueOpen={setQueueOpen}
        autoplay={autoplay} setAutoplay={value => {
          setAutoplay(value); if (!value) setCountdown(null);
          try { localStorage.setItem('playerAutoplayNext', String(value)); } catch { /* Optional preference. */ }
        }}
        countdown={countdown} cancelCountdown={() => setCountdown(null)}
        onEnded={() => { if (mode === 'watch' && autoplay && next) setCountdown(5); }}
        choose={choose} onBack={onBack} />
    </div>
  );
}

interface SessionProps {
  mode: 'watch' | 'categorize';
  playbackRef?: Ref<PlayerHandle>;
  onPositionChange?: (time: number, duration: number) => void;
  item: PlayerItem;
  items: PlayerItem[];
  index: number;
  rootRef: RefObject<HTMLDivElement | null>;
  playlistTitle?: string;
  startTime?: number;
  queueOpen: boolean;
  setQueueOpen: (open: boolean) => void;
  autoplay: boolean;
  setAutoplay: (value: boolean) => void;
  countdown: number | null;
  cancelCountdown: () => void;
  onEnded: () => void;
  choose: (id: string) => void;
  onBack: () => void;
}

function PlaybackSession({ item, items, index, playlistTitle, startTime, rootRef, queueOpen, setQueueOpen, mode, playbackRef, onPositionChange,
  autoplay, setAutoplay, countdown, cancelCountdown, onEnded, choose, onBack }: Readonly<SessionProps>) {
  const { t } = useLanguage();
  const { data: details, error: detailsError } = useMovie(mode === 'watch' ? item.id : undefined);
  let loadedTime: number | undefined;
  if (details) loadedTime = details.watchTime ?? 0;
  else if (detailsError) loadedTime = 0;
  const resumeTime = mode === 'categorize' ? 0 : startTime ?? item.watchTime ?? loadedTime;
  const regionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const p = usePlayback(item.id, videoRef, resumeTime, mode === 'watch');
  const recommendations = useRecommendations(item.id, p.time, p.duration, mode === 'watch');
  useImperativeHandle(playbackRef, () => ({ seek: p.seek }), [p.seek]);
  useEffect(() => { onPositionChange?.(p.time, p.duration); }, [p.time, p.duration, onPositionChange]);
  const displayItem = { ...item, categories: item.categories ?? details?.categories, categorySegments: item.categorySegments ?? details?.categorySegments };
  const [visible, setVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [pipAvailable, setPipAvailable] = useState(false);
  const [notice, setNotice] = useState('');
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const wakeControls = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (p.playing && !queueOpen && countdown === null && !p.error) {
      hideTimer.current = setTimeout(() => {
        const focus = document.activeElement;
        if (!controlsRef.current?.contains(focus) && !headerRef.current?.contains(focus)) setVisible(false);
      }, 3500);
    }
  }, [p.playing, p.error, queueOpen, countdown]);

  useEffect(() => {
    wakeControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [wakeControls]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${item.title} · Netflix`;
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    changed();
    document.addEventListener('fullscreenchange', changed);
    setPipAvailable(Boolean(document.pictureInPictureEnabled && videoRef.current?.requestPictureInPicture));
    return () => { document.title = previousTitle; document.removeEventListener('fullscreenchange', changed); };
  }, [item.title]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (rootRef.current?.requestFullscreen) await rootRef.current.requestFullscreen();
      else {
        const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
        if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
        else setNotice(t('Fullscreen is unavailable on this device.'));
      }
    } catch { setNotice(t('Fullscreen is unavailable on this device.')); }
  };
  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (p.ready) await videoRef.current?.requestPictureInPicture();
    } catch { setNotice(t('Picture in picture is unavailable.')); }
  };
  const selectItem = (id: string) => { p.commitProgress(); choose(id); };
  const previous = index > 0 ? () => selectItem(items[index - 1].id) : undefined;
  const next = index < items.length - 1 ? () => selectItem(items[index + 1].id) : undefined;

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (event.altKey || event.ctrlKey || event.metaKey || target.isContentEditable || target.closest('input,select,textarea')) return;
    const key = event.key.toLowerCase();
    if ((key === ' ' || key === 'enter') && target.closest('button,a')) return;
    const actions: Record<string, () => void> = {
      ' ': p.togglePlay, k: p.togglePlay, arrowleft: () => p.seek(p.time - 10), arrowright: () => p.seek(p.time + 10),
      arrowup: () => p.changeVolume(p.volume + 0.05), arrowdown: () => p.changeVolume(p.volume - 0.05),
      m: p.toggleMute, f: () => { void toggleFullscreen(); }, i: () => { void togglePip(); },
      n: () => next?.(), p: () => previous?.(), escape: () => setQueueOpen(false),
    };
    if (actions[key]) { event.preventDefault(); actions[key](); wakeControls(); }
  };

  useEffect(() => {
    const region = regionRef.current;
    region?.addEventListener('keydown', onKeyDown);
    return () => region?.removeEventListener('keydown', onKeyDown);
  });

  const showControls = visible || !p.playing || queueOpen || p.error || countdown !== null;
  if (mode === 'categorize') return <section ref={regionRef} aria-label={t('Video player')} className="flex w-full flex-col">
    <div className="relative aspect-video max-h-[65vh] w-full bg-black">
      <PlaybackSurface item={item} autoPlay={false} p={p} videoRef={videoRef} onEnded={onEnded} cancelCountdown={cancelCountdown} toggleFullscreen={toggleFullscreen} />
      <div className="absolute right-3 top-3 z-20 max-w-[50%]"><VideoCategoryBadges categories={displayItem.categories} /></div>
    </div>
    <div className="border-t border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      {notice && <output className="mb-2 block text-sm text-amber-300">{notice}</output>}
      <PlayerControls playback={p} showCategoryLegend segments={displayItem.categorySegments} fullscreen={fullscreen} toggleFullscreen={() => { void toggleFullscreen(); }} pipAvailable={pipAvailable} togglePip={() => { void togglePip(); }} />
    </div>
  </section>;
  return (
    <section ref={regionRef} aria-label={t('Video player')}
      onPointerMove={wakeControls} onPointerDown={wakeControls} onFocusCapture={wakeControls}
      className={`relative h-full w-full outline-none ${showControls ? '' : 'cursor-none'}`}>
      <PlaybackSurface item={item} autoPlay={mode === 'watch'} p={p} videoRef={videoRef} onEnded={onEnded} cancelCountdown={cancelCountdown} toggleFullscreen={toggleFullscreen} />
      <PlaybackChrome item={displayItem} p={p} items={items} index={index} playlistTitle={playlistTitle} showControls={Boolean(showControls)}
        headerRef={headerRef} controlsRef={controlsRef} onBack={onBack} queueOpen={queueOpen} setQueueOpen={setQueueOpen}
        notice={notice} countdown={countdown} previous={previous} next={next} fullscreen={fullscreen}
        toggleFullscreen={toggleFullscreen} pipAvailable={pipAvailable} togglePip={togglePip} />
      <EndRecommendations items={recommendations} visible={p.ended} countdown={countdown} next={items[index + 1]}
        onNext={() => next?.()} onCancel={cancelCountdown} onSelect={() => { p.commitProgress(); cancelCountdown(); }} />
      {queueOpen && <PlaylistQueue items={items} activeId={item.id} playlistTitle={playlistTitle} autoplay={autoplay} setAutoplay={setAutoplay} setQueueOpen={setQueueOpen} selectItem={selectItem} />}
    </section>
  );
}

function PlaylistQueue({ items, activeId, playlistTitle, autoplay, setAutoplay, setQueueOpen, selectItem }: Readonly<
  Pick<SessionProps, 'items' | 'playlistTitle' | 'autoplay' | 'setAutoplay' | 'setQueueOpen'> & { activeId: string; selectItem: (id: string) => void }
>) {
  const { t } = useLanguage();
  return (
    <aside aria-label={t('Playlist')} className="absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0"><p className="text-xs uppercase tracking-widest text-red-400">{t('Playlist')}</p><h2 className="mt-1 truncate font-semibold">{playlistTitle}</h2></div>
          <PlayerButton label={t('Close playlist')} onClick={() => setQueueOpen(false)}><X /></PlayerButton>
        </div>
        <label className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 px-4 text-sm"><span>{t('Autoplay next video')}</span><input type="checkbox" checked={autoplay} onChange={event => setAutoplay(event.target.checked)} className="h-5 w-5 accent-red-600" /></label>
        <ol className="flex-1 space-y-1 overflow-y-auto p-2">
          {items.map((entry, entryIndex) => <li key={entry.id}>
            <button type="button" aria-current={entry.id === activeId ? 'true' : undefined} onClick={() => selectItem(entry.id)}
              className={`flex min-h-20 w-full items-center gap-3 rounded-xl p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${entry.id === activeId ? 'bg-red-600/15 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="w-5 shrink-0 text-center text-xs tabular-nums">{entry.id === activeId ? <Play className="h-4 w-4 fill-red-500 text-red-500" aria-hidden="true" /> : entryIndex + 1}</span>
              <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded bg-zinc-800"><Image src={entry.thumbnailUrl || `/api/catalog/thumbnails/${encodeURIComponent(entry.id)}`} alt="" fill sizes="80px" className="object-cover" /></span>
              <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium">{entry.title}</span>
              {entry.id === activeId && <Check className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />}
            </button>
          </li>)}
        </ol>
      </aside>
  );
}

function PlaybackSurface({ item, p, videoRef, onEnded, cancelCountdown, toggleFullscreen, autoPlay }: Readonly<{
  autoPlay: boolean;
  item: PlayerItem;
  p: ReturnType<typeof usePlayback>;
  videoRef: RefObject<HTMLVideoElement | null>;
  onEnded: () => void;
  cancelCountdown: () => void;
  toggleFullscreen: () => Promise<void>;
}>) {
  const { t } = useLanguage();
  return <>
      <video id="videoElement" ref={videoRef} autoPlay={autoPlay} muted={p.muted} playsInline preload="metadata" poster={item.thumbnailUrl}
        aria-label={item.title} className="h-full w-full object-contain" {...p.events}
        onEnded={() => { p.events.onEnded(); onEnded(); }}>
        <source src={`/api/video/${encodeURIComponent(item.id)}`} type="video/mp4" onError={p.events.onError} />
        {item.captions?.map(track => <track key={track.src} kind="captions" src={track.src} srcLang={track.language} label={track.label} default={track.default} />)}
      </video>
      {!p.error && (
        <button type="button" aria-label={t(p.playing ? 'Pause video' : 'Play video')} onClick={() => { cancelCountdown(); p.togglePlay(); }}
          onDoubleClick={() => { void toggleFullscreen(); }}
          className="absolute inset-0 flex h-full w-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500">
          {!p.playing && !p.waiting && <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-black/60 shadow-2xl"><Play className="h-8 w-8 fill-white" aria-hidden="true" /></span>}
        </button>
      )}
      {p.waiting && !p.error && <output className="pointer-events-none absolute inset-0 flex items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-red-500" aria-hidden="true" /><span className="sr-only">{t('Loading video...')}</span></output>}
      {p.error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 text-center">
        <h2 className="text-xl font-semibold">{t('Video could not be played.')}</h2>
        <p className="max-w-md text-sm text-zinc-400">{t('Check your connection and the video format, then try again.')}</p>
        <button type="button" onClick={p.retry} className="min-h-11 rounded-lg bg-red-600 px-6 font-semibold hover:bg-red-500">{t('Retry')}</button>
      </div>}
  </>;
}

function PlaybackChrome({ item, p, items, index, playlistTitle, showControls, headerRef, controlsRef, onBack, queueOpen, setQueueOpen,
  notice, countdown, previous, next, fullscreen, toggleFullscreen, pipAvailable, togglePip }: Readonly<
  Pick<SessionProps, 'item' | 'items' | 'index' | 'playlistTitle' | 'onBack' | 'queueOpen' | 'setQueueOpen' | 'countdown'> & {
    p: ReturnType<typeof usePlayback>; showControls: boolean;
    headerRef: RefObject<HTMLElement | null>; controlsRef: RefObject<HTMLDivElement | null>;
    notice: string; previous?: () => void; next?: () => void; fullscreen: boolean;
    toggleFullscreen: () => Promise<void>; pipAvailable: boolean; togglePip: () => Promise<void>;
  }
>) {
  const { t } = useLanguage();
  return <>
      <header ref={headerRef} inert={!showControls} className={`absolute inset-x-0 top-0 z-20 flex items-start gap-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-4 pb-16 transition-opacity sm:gap-5 sm:p-6 sm:pb-20 ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <PlayerButton label={t('Back')} onClick={() => { p.commitProgress(); onBack(); }}><ArrowLeft /></PlayerButton>
        <div className="min-w-0 flex-1 pt-1">
          <p className="mb-1 truncate text-xs font-medium uppercase tracking-widest text-zinc-400">{playlistTitle || t('Now playing')}{items.length > 1 ? ` · ${index + 1} / ${items.length}` : ''}</p>
          <h1 className="line-clamp-2 text-base font-semibold leading-snug sm:text-2xl" title={item.title}>{item.title}</h1>
        </div>
        {(playlistTitle || item.categories?.length) ? <div className="ml-auto flex max-w-[45%] flex-col items-end gap-2">
          <VideoCategoryBadges categories={item.categories} />
          {playlistTitle && <PlayerButton label={t('Playlist')} onClick={() => setQueueOpen(!queueOpen)} pressed={queueOpen}><ListVideo /></PlayerButton>}
        </div> : null}
      </header>
      <div ref={controlsRef} inert={!showControls} className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-20 transition-opacity sm:px-6 ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {(notice || p.progressError) && <output className="mb-3 block text-sm text-amber-300">{notice || t('Progress could not be saved. Playback can continue.')}</output>}
        {p.ended && countdown === null && <output className="mb-3 block text-sm text-zinc-300">{t('Playback finished.')}</output>}
        <PlayerControls playback={p} segments={item.categorySegments} previous={previous} next={next} fullscreen={fullscreen} toggleFullscreen={() => { void toggleFullscreen(); }} pipAvailable={pipAvailable} togglePip={() => { void togglePip(); }} />
        <p className="mt-2 hidden text-xs text-zinc-500 lg:block">{t('Space / K: play or pause · ← →: seek · M: mute · F: fullscreen · N / P: next or previous')}</p>
      </div>
  </>;
}
