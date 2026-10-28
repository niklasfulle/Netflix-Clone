'use client';

import { useId, useState, type ReactNode } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { categoryLabel } from '@/lib/category-label';
import type { CategorySegment } from '@/lib/manual-categorization/types';
import { formatCategoryTime } from '@/lib/manual-categorization/types';
import { categoryColor } from '@/lib/category-color';

export function categoryTimelineColor(id: string, color?: string | null): string {
  return categoryColor({ id, color });
}

export function CategoryTimeline({ segments, duration, time, onSeek, showLegend = true, seekControl, buffered = 0 }: Readonly<{
  segments: CategorySegment[]; duration: number; time: number; onSeek: (seconds: number) => void;
  showLegend?: boolean; seekControl?: ReactNode; buffered?: number;
}>) {
  const { t, locale } = useLanguage();
  const tooltipId = useId();
  const [hover, setHover] = useState<{ ratio: number; seconds: number } | null>(null);
  const [focused, setFocused] = useState<CategorySegment | null>(null);
  if (!seekControl && (!segments.length || !Number.isFinite(duration) || duration <= 0)) return null;
  const percent = (seconds: number) => duration > 0 ? Math.min(100, Math.max(0, seconds / duration * 100)) : 0;
  const groups = new Map<string, CategorySegment[]>();
  for (const segment of segments) {
    const group = groups.get(segment.categoryId) ?? [];
    group.push(segment); groups.set(segment.categoryId, group);
  }
  const colors = new Map([...groups].map(([id, ranges]) => [id, categoryTimelineColor(id, ranges[0].category.color)]));
  const tooltipTime = hover?.seconds ?? focused?.startSeconds;
  const tooltipRanges = tooltipTime === undefined ? [] : segments.filter(segment => tooltipTime >= segment.startSeconds && tooltipTime < segment.endSeconds);
  const tooltipCategories = [...new Map(tooltipRanges.map(segment => [segment.categoryId, segment.category])).values()];
  const anchor = hover?.ratio ?? percent(focused?.startSeconds ?? 0) / 100;
  return <section aria-label={t('Timeline categories')} className="space-y-1.5">
    {showLegend && groups.size > 0 && <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span className="text-zinc-400">{t('Timeline categories')}</span>
      <ul className="flex max-h-16 flex-wrap gap-x-4 gap-y-1 overflow-y-auto">
        {[...groups].map(([id, ranges]) => <li key={id} className="inline-flex min-w-0 items-center gap-1.5 text-zinc-200">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors.get(id) }} />
          <span className="break-words">{categoryLabel(ranges[0].category, locale)}</span>
        </li>)}
      </ul>
    </div>}
    <div className="relative w-full">
    <fieldset className={`relative w-full border-0 p-0 ${seekControl ? 'h-8' : 'h-6'}`}
      onMouseMove={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const inset = seekControl ? 8 : 0;
        if (bounds.width <= 2 * inset) return;
        const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left - inset) / (bounds.width - 2 * inset)));
        setHover({ ratio, seconds: ratio * duration });
      }} onMouseLeave={() => setHover(null)}>
      <legend className="sr-only">{t('Timeline categories')}</legend>
      <div className={seekControl ? 'absolute inset-x-2 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/20' : 'relative h-full w-full rounded bg-white/10'}>
      {seekControl && <>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${percent(buffered)}%` }} />
        <div aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-red-500/70" style={{ width: `${percent(time)}%` }} />
      </>}
      {[...groups].flatMap(([id, ranges]) => ranges.map(segment => {
            const start = Math.min(duration, Math.max(0, segment.startSeconds));
            const end = Math.min(duration, segment.endSeconds);
            if (end <= start) return null;
            const active = time >= start && time < end;
            const label = `${categoryLabel(segment.category, locale)} · ${formatCategoryTime(start)} – ${formatCategoryTime(end)}`;
            return <button key={`${id}-${segment.startSeconds}-${segment.endSeconds}`} type="button" aria-label={label} aria-current={active ? 'true' : undefined}
              aria-describedby={tooltipRanges.includes(segment) ? tooltipId : undefined} onFocus={() => setFocused(segment)} onBlur={() => setFocused(null)}
              onClick={() => onSeek(start)} className={`absolute min-w-px rounded border transition hover:z-10 hover:opacity-100 focus-visible:z-30 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:-outline-offset-2 ${seekControl ? '-inset-y-0.5' : 'inset-y-0.5'} ${active ? 'border-white opacity-100' : 'border-white/60 opacity-90'}`}
              style={{ backgroundColor: colors.get(id), left: `${start / duration * 100}%`, width: `${(end - start) / duration * 100}%` }} />;
          }))}
      {!seekControl && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 z-30 w-px bg-white" style={{ left: `${percent(time)}%` }} />}
      </div>
      {seekControl}
    </fieldset>
    {tooltipRanges.length > 0 && <div id={tooltipId} role="tooltip" className="pointer-events-none absolute bottom-full z-50 mb-2 w-max rounded-xl border border-zinc-600 bg-zinc-950/95 p-3 text-xs text-white shadow-xl"
      style={{ ...(anchor >= 0.5 ? { right: `${(1 - anchor) * 100}%` } : { left: `${anchor * 100}%` }), maxWidth: `min(20rem, ${(anchor >= 0.5 ? anchor : 1 - anchor) * 100}%)` }}>
      <ul className="space-y-2">{tooltipCategories.map(category => <li key={category.id} className="flex items-start gap-2">
        <span aria-hidden="true" className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors.get(category.id) }} />
        <strong className="min-w-0 break-words font-medium">{categoryLabel(category, locale)}</strong>
      </li>)}</ul>
    </div>}
    </div>
  </section>;
}
