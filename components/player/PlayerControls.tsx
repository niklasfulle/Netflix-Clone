"use client";

import { Maximize, Minimize, Pause, PictureInPicture2, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { formatMediaTime } from './types';
import type { usePlayback } from './usePlayback';
import { CategoryTimeline } from './CategoryTimeline';
import type { CategorySegment } from '@/lib/manual-categorization/types';

export function PlayerButton({ label, children, onClick, disabled = false, pressed }: Readonly<{
  label: string; children: ReactNode; onClick: () => void; disabled?: boolean; pressed?: boolean;
}>) {
  return <button type="button" aria-label={label} title={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}
    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-30 [&_svg]:h-5 [&_svg]:w-5">{children}</button>;
}

interface Props {
  playback: ReturnType<typeof usePlayback>;
  previous?: () => void;
  next?: () => void;
  fullscreen: boolean;
  toggleFullscreen: () => void;
  pipAvailable: boolean;
  togglePip: () => void;
  segments?: CategorySegment[];
  showCategoryLegend?: boolean;
}

export default function PlayerControls({ playback: p, previous, next, fullscreen, toggleFullscreen, pipAvailable, togglePip, segments = [], showCategoryLegend = false }: Readonly<Props>) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <CategoryTimeline segments={segments} duration={p.duration} time={p.time} buffered={p.buffered} showLegend={showCategoryLegend} onSeek={second => { p.seek(second); p.commitProgress(); }} seekControl={
        <input type="range" aria-label={t('Seek')} aria-valuetext={`${formatMediaTime(p.time)} / ${formatMediaTime(p.duration)}`}
          min={0} max={p.duration || 0} step={0.1} value={Math.min(p.time, p.duration)} disabled={!p.ready || p.error}
          onChange={e => p.seek(Number(e.target.value))} onPointerUp={p.commitProgress}
          onKeyUp={p.commitProgress}
          className="relative z-20 m-0 h-8 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-red-500" />
      } />
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <PlayerButton label={t(p.playing ? 'Pause' : 'Play')} onClick={p.togglePlay} disabled={p.error}>{p.playing ? <Pause /> : <Play />}</PlayerButton>
          {previous && <PlayerButton label={t('Previous video')} onClick={previous}><SkipBack /></PlayerButton>}
          <PlayerButton label={t('Back 10 seconds')} onClick={() => p.seek(p.time - 10)} disabled={!p.ready}><RotateCcw /></PlayerButton>
          <PlayerButton label={t('Forward 10 seconds')} onClick={() => p.seek(p.time + 10)} disabled={!p.ready}><RotateCw /></PlayerButton>
          {next && <PlayerButton label={t('Next video')} onClick={next}><SkipForward /></PlayerButton>}
          <span className="ml-1 whitespace-nowrap text-xs tabular-nums text-zinc-200 sm:ml-3 sm:text-sm">{formatMediaTime(p.time)} <span className="text-zinc-500">/</span> {formatMediaTime(p.duration)}</span>
        </div>
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-0.5 sm:gap-2">
          <PlayerButton label={t(p.muted || p.volume === 0 ? 'Unmute' : 'Mute')} onClick={p.toggleMute}>{p.muted || p.volume === 0 ? <VolumeX /> : <Volume2 />}</PlayerButton>
          {p.volumeControlSupported ? <input aria-label={t('Volume')} type="range" min={0} max={1} step={0.05} value={p.muted ? 0 : p.volume}
            onChange={e => p.changeVolume(Number(e.target.value))} className="h-11 w-16 accent-red-600 sm:w-20" />
            : <span title={t('Use device volume buttons or Control Center.')} className="max-w-32 px-1 text-xs leading-tight text-zinc-300">{t('Use device volume buttons')}</span>}
          <select aria-label={t('Playback speed')} value={p.rate} onChange={e => p.changeRate(Number(e.target.value))}
            className="h-11 rounded-lg border border-white/10 bg-black/80 px-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}
          </select>
          {pipAvailable && <PlayerButton label={t('Picture in picture')} onClick={togglePip}><PictureInPicture2 /></PlayerButton>}
          <PlayerButton label={t(fullscreen ? 'Exit fullscreen' : 'Fullscreen')} onClick={toggleFullscreen}>{fullscreen ? <Minimize /> : <Maximize />}</PlayerButton>
        </div>
      </div>
    </div>
  );
}
