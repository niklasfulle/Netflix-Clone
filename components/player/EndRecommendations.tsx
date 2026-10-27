'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Tags, Users } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { VideoRecommendation } from '@/lib/recommendations/types';
import type { PlayerItem } from './types';

const recommendationReasonLabels: Record<VideoRecommendation['reason'], TranslationKey> = {
  'same-actor': 'Shared cast',
  'similar-categories': 'Similar categories',
  'more-to-watch': 'More to watch',
};
const recommendationReasonIcons = {
  'same-actor': Users,
  'similar-categories': Tags,
  'more-to-watch': Play,
};

export function EndRecommendations({ items, visible, countdown, next, onNext, onCancel, onSelect }: Readonly<{
  items: VideoRecommendation[]; visible: boolean; countdown: number | null; next?: PlayerItem;
  onNext: () => void; onCancel: () => void; onSelect: () => void;
}>) {
  const { t } = useLanguage();
  // Keep eagerly loaded image elements mounted before the video ends. Revealing
  // this panel reuses those elements even when thumbnail responses are no-store.
  return <section aria-label={t('Recommended videos')} hidden={!visible} className="absolute inset-x-3 bottom-36 top-24 z-30 overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950/95 p-4 shadow-[0_24px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:inset-x-6 sm:p-6 lg:bottom-32 lg:top-20 lg:p-8">
    <div className="mx-auto flex min-h-full w-full max-w-[100rem] flex-col gap-5 lg:h-full lg:min-h-0 lg:gap-6">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4"><div>
        <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400 sm:text-xs"><span aria-hidden="true" className="h-px w-6 bg-red-500" />{t('Recommended videos')}</p>
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-3xl xl:text-4xl">{t('More to watch')}</h2>
      </div>
        {countdown !== null && next && <section aria-label={t('Up next')} className="flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-zinc-300">
          <output>{t('Up next')} · {countdown}s · {next.title}</output>
          <button type="button" onClick={onNext} className="min-h-11 rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-500">{t('Play now')}</button>
          <button type="button" onClick={onCancel} className="min-h-11 rounded-lg bg-white/10 px-4 text-white hover:bg-white/20">{t('Cancel')}</button>
        </section>}
      </div>
      {items.length ? <ol className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:min-h-0 lg:flex-1 lg:gap-5 ${items.length > 3 ? 'lg:grid-rows-[repeat(2,minmax(15rem,1fr))]' : 'lg:grid-rows-[minmax(15rem,1fr)]'}`}>{items.map(item => {
        const ReasonIcon = recommendationReasonIcons[item.reason];
        return <li key={item.id} className="min-w-0">
        <Link href={`/watch/${encodeURIComponent(item.id)}`} prefetch={false} onClick={onSelect} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-lg transition hover:border-white/30 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 motion-safe:hover:-translate-y-0.5">
          <div className="relative aspect-video overflow-hidden bg-zinc-800 lg:aspect-auto lg:min-h-0 lg:flex-1">
            <Image src={item.thumbnailUrl} alt="" fill sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, (max-width: 1700px) 31vw, 520px" unoptimized loading="eager" fetchPriority="low" className="object-cover transition duration-300 motion-safe:group-hover:scale-105" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute left-2 top-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full border border-white/15 bg-black/70 px-2 py-1 text-[9px] font-medium text-white backdrop-blur sm:left-3 sm:top-3 sm:gap-1.5 sm:px-2.5 sm:text-xs">
              <ReasonIcon aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="truncate">{t(recommendationReasonLabels[item.reason])}</span>
            </span>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-xl sm:h-16 sm:w-16"><Play className="h-5 w-5 fill-white text-white sm:h-7 sm:w-7" /></span></span>
          </div>
          <div className="shrink-0 px-3 py-3 sm:px-4 sm:py-4"><h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-white sm:min-h-12 sm:text-lg xl:text-xl">{item.title}</h3></div>
        </Link>
      </li>;
      })}</ol> : <p className="text-sm text-zinc-400">{t('No further suggestions are available.')}</p>}
    </div>
  </section>;
}
