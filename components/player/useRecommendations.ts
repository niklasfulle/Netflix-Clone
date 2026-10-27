'use client';

import { useEffect, useState } from 'react';
import { recommendationsResponseSchema, type VideoRecommendation } from '@/lib/recommendations/types';

export const RECOMMENDATION_PRELOAD_SECONDS = 120;

export function useRecommendations(movieId: string, time: number, duration: number, enabled: boolean) {
  const [armedFor, setArmedFor] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<{ movieId: string; items: VideoRecommendation[] }>();
  const due = enabled && Number.isFinite(duration) && duration > 0 && time >= Math.max(0, duration - RECOMMENDATION_PRELOAD_SECONDS);
  useEffect(() => { if (due) setArmedFor(movieId); }, [due, movieId]);
  useEffect(() => {
    if (!enabled || armedFor !== movieId) return;
    const abort = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/movies/${encodeURIComponent(movieId)}/recommendations`, { cache: 'no-store', signal: abort.signal });
        if (!response.ok) throw new Error('Recommendations unavailable');
        const result = recommendationsResponseSchema.parse(await response.json());
        if (!abort.signal.aborted) setPrepared({ movieId, items: result.items });
      } catch {
        if (!abort.signal.aborted) setPrepared({ movieId, items: [] });
      }
    })();
    return () => abort.abort();
  }, [movieId, armedFor, enabled]);
  return prepared?.movieId === movieId ? prepared.items : [];
}
