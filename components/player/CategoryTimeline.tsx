'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { categoryLabel } from '@/lib/category-label';
import type { CategorySegment } from '@/lib/manual-categorization/types';
import { formatCategoryTime } from '@/lib/manual-categorization/types';

export function CategoryTimeline({ segments, duration, time, onSeek }: Readonly<{
  segments: CategorySegment[]; duration: number; time: number; onSeek: (seconds: number) => void;
}>) {
  const { t, locale } = useLanguage();
  if (!segments.length || !Number.isFinite(duration) || duration <= 0) return null;
  const groups = new Map<string, CategorySegment[]>();
  for (const segment of segments) {
    const group = groups.get(segment.categoryId) ?? [];
    group.push(segment); groups.set(segment.categoryId, group);
  }
  return <section aria-label={t('Timeline categories')} className="space-y-1.5">
    <p className="text-xs font-medium text-zinc-400">{t('Timeline categories')}</p>
    <div className="max-h-28 space-y-1 overflow-y-auto overscroll-contain pr-1">
      {[...groups].map(([id, ranges]) => <div key={id} className="grid min-h-7 grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <span title={categoryLabel(ranges[0].category, locale)} className="truncate text-xs text-zinc-300">{categoryLabel(ranges[0].category, locale)}</span>
        <div className="relative h-6 rounded bg-white/5">
          {ranges.map(segment => {
            const start = Math.min(duration, Math.max(0, segment.startSeconds));
            const end = Math.min(duration, segment.endSeconds);
            if (end <= start) return null;
            const active = time >= start && time < end;
            const label = `${categoryLabel(segment.category, locale)} · ${formatCategoryTime(start)} – ${formatCategoryTime(end)}`;
            return <button key={`${segment.startSeconds}-${segment.endSeconds}`} type="button" title={label} aria-label={label} aria-current={active ? 'true' : undefined}
              onClick={() => onSeek(start)} className={`absolute inset-y-0.5 min-w-1 rounded border transition focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${active ? 'border-amber-200 bg-amber-400/80' : 'border-red-300/60 bg-red-500/65 hover:bg-red-400'}`}
              style={{ left: `${start / duration * 100}%`, width: `${(end - start) / duration * 100}%` }} />;
          })}
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-white" style={{ left: `${Math.min(100, Math.max(0, time / duration * 100))}%` }} />
        </div>
      </div>)}
    </div>
  </section>;
}
