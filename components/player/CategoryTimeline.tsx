'use client';

import { useId, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { categoryLabel } from '@/lib/category-label';
import type { CategorySegment } from '@/lib/manual-categorization/types';
import { formatCategoryTime } from '@/lib/manual-categorization/types';

export function categoryTimelineColor(id: string): string {
  // Identity, rather than label, ordering or the other visible categories, owns the color.
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return `hsl(${hash % 36000 / 100} 78% 62%)`;
}

export function CategoryTimeline({ segments, duration, time, onSeek }: Readonly<{
  segments: CategorySegment[]; duration: number; time: number; onSeek: (seconds: number) => void;
}>) {
  const { t, locale } = useLanguage();
  const tooltipId = useId();
  const [hover, setHover] = useState<{ ratio: number; seconds: number } | null>(null);
  const [focused, setFocused] = useState<CategorySegment | null>(null);
  if (!segments.length || !Number.isFinite(duration) || duration <= 0) return null;
  const groups = new Map<string, CategorySegment[]>();
  for (const segment of segments) {
    const group = groups.get(segment.categoryId) ?? [];
    group.push(segment); groups.set(segment.categoryId, group);
  }
  const colors = new Map([...groups.keys()].map(id => [id, categoryTimelineColor(id)]));
  const tooltipTime = hover?.seconds ?? focused?.startSeconds;
  const tooltipRanges = tooltipTime === undefined ? [] : segments.filter(segment => tooltipTime >= segment.startSeconds && tooltipTime < segment.endSeconds);
  const anchor = hover?.ratio ?? Math.min(1, (focused?.startSeconds ?? 0) / duration);
  return <section aria-label={t('Timeline categories')} className="space-y-1.5">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span className="text-zinc-400">{t('Timeline categories')}</span>
      <ul className="flex max-h-16 flex-wrap gap-x-4 gap-y-1 overflow-y-auto">
        {[...groups].map(([id, ranges]) => <li key={id} className="inline-flex min-w-0 items-center gap-1.5 text-zinc-200">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors.get(id) }} />
          <span className="break-words">{categoryLabel(ranges[0].category, locale)}</span>
        </li>)}
      </ul>
    </div>
    <div className="relative w-full">
    <div role="group" aria-label={t('Timeline categories')} className="relative h-6 w-full overflow-hidden rounded bg-white/10"
      onMouseMove={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (bounds.width <= 0) return;
        const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        setHover({ ratio, seconds: ratio * duration });
      }} onMouseLeave={() => setHover(null)}>
      {[...groups].flatMap(([id, ranges]) => ranges.map(segment => {
            const start = Math.min(duration, Math.max(0, segment.startSeconds));
            const end = Math.min(duration, segment.endSeconds);
            if (end <= start) return null;
            const active = time >= start && time < end;
            const label = `${categoryLabel(segment.category, locale)} · ${formatCategoryTime(start)} – ${formatCategoryTime(end)}`;
            return <button key={`${id}-${segment.startSeconds}-${segment.endSeconds}`} type="button" aria-label={label} aria-current={active ? 'true' : undefined}
              aria-describedby={tooltipRanges.includes(segment) ? tooltipId : undefined} onFocus={() => setFocused(segment)} onBlur={() => setFocused(null)}
              onClick={() => onSeek(start)} className={`absolute inset-y-0.5 min-w-px rounded border transition hover:z-10 hover:opacity-100 focus-visible:z-20 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:-outline-offset-2 ${active ? 'border-white opacity-90' : 'border-white/40 opacity-65'}`}
              style={{ backgroundColor: colors.get(id), left: `${start / duration * 100}%`, width: `${(end - start) / duration * 100}%` }} />;
          }))}
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 z-30 w-px bg-white" style={{ left: `${Math.min(100, Math.max(0, time / duration * 100))}%` }} />
    </div>
    {tooltipRanges.length > 0 && <div id={tooltipId} role="tooltip" className="pointer-events-none absolute bottom-full z-50 mb-2 w-max rounded-xl border border-zinc-600 bg-zinc-950/95 p-3 text-xs text-white shadow-xl"
      style={{ ...(anchor >= 0.5 ? { right: `${(1 - anchor) * 100}%` } : { left: `${anchor * 100}%` }), maxWidth: `min(20rem, ${(anchor >= 0.5 ? anchor : 1 - anchor) * 100}%)` }}>
      <ul className="space-y-2">{tooltipRanges.map(segment => <li key={`${segment.categoryId}-${segment.startSeconds}-${segment.endSeconds}`} className="flex items-start gap-2">
        <span aria-hidden="true" className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors.get(segment.categoryId) }} />
        <span className="min-w-0"><strong className="block break-words font-medium">{categoryLabel(segment.category, locale)}</strong><span className="mt-0.5 block break-words font-mono text-zinc-400">{formatCategoryTime(segment.startSeconds)} – {formatCategoryTime(segment.endSeconds)}</span></span>
      </li>)}</ul>
    </div>}
    </div>
  </section>;
}
