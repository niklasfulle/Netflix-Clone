'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { VideoRecommendation } from '@/lib/recommendations/types';
import type { PlayerItem } from './types';

export function EndRecommendations({ items, visible, countdown, next, onNext, onCancel, onSelect }: Readonly<{
  items: VideoRecommendation[]; visible: boolean; countdown: number | null; next?: PlayerItem;
  onNext: () => void; onCancel: () => void; onSelect: () => void;
}>) {
  const { t } = useLanguage();
  // Keep eagerly loaded image elements mounted before the video ends. Revealing
  // this panel reuses those elements even when thumbnail responses are no-store.
  return <section aria-label={t('Recommended videos')} hidden={!visible} className="absolute inset-x-3 bottom-36 top-24 z-30 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl sm:inset-x-6 sm:p-6">
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white sm:text-2xl">{t('More to watch')}</h2>
        {countdown !== null && next && <section aria-label={t('Up next')} className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
          <output>{t('Up next')} · {countdown}s · {next.title}</output>
          <button type="button" onClick={onNext} className="min-h-11 rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-500">{t('Play now')}</button>
          <button type="button" onClick={onCancel} className="min-h-11 rounded-lg bg-white/10 px-4 text-white hover:bg-white/20">{t('Cancel')}</button>
        </section>}
      </div>
      {items.length ? <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">{items.map(item => <li key={item.id}>
        <Link href={`/watch/${encodeURIComponent(item.id)}`} prefetch={false} onClick={onSelect} className="group block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400">
          <div className="relative aspect-video overflow-hidden bg-zinc-800"><Image src={item.thumbnailUrl} alt="" fill sizes="(max-width: 639px) 45vw, 320px" unoptimized loading="eager" fetchPriority="low" className="object-cover transition group-hover:scale-105" /></div>
          <div className="space-y-1 p-2 sm:p-3"><h3 className="line-clamp-2 text-sm font-medium leading-snug text-white">{item.title}</h3><p className="text-xs text-zinc-400">{t(item.reason === 'same-actor' ? 'Shared cast' : item.reason === 'similar-categories' ? 'Similar categories' : 'More to watch')}</p></div>
        </Link>
      </li>)}</ol> : <p className="text-sm text-zinc-400">{t('No further suggestions are available.')}</p>}
    </div>
  </section>;
}
