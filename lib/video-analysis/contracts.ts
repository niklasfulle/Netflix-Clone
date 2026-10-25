import { z } from 'zod';
import { ANALYSIS_INTERVAL_SECONDS, MIN_CATEGORY_SCORE, SINGLE_SEGMENT_NEW_CATEGORY_SCORE } from './profile';

export const VIDEO_ANALYSIS_MODEL = 'qwen3-vl-4b-q4km-1cd86afb-catalog-v5';
export const MAX_ANALYSIS_SAMPLES = 120;
export const normalizedCategoryName = (name: string) => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

export class VideoAnalysisError extends Error {
  constructor(readonly code: string, readonly permanent = false) {
    super(code);
    this.name = 'VideoAnalysisError';
  }
}

export const frameTagsSchema = z.object({
  tags: z.array(z.object({
    name: z.string().transform(name => name.normalize('NFKC').trim().replace(/\s+/g, ' ')).pipe(z.string().min(1).max(80)),
    nameEn: z.string().transform(name => name.normalize('NFKC').trim().replace(/\s+/g, ' ')).pipe(z.string().min(1).max(80)).optional(),
    confidence: z.number().finite().min(0).max(1),
  }).strict()).max(5),
  uncertain: z.boolean(),
}).strict();

export type FrameTags = z.infer<typeof frameTagsSchema>;
export type Observation = { atSeconds: number; tags: FrameTags };

export function analysisSampleTimes(duration: number): number[] {
  if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 3600) throw new VideoAnalysisError('INVALID_VIDEO_DURATION', true);
  const count = Math.min(MAX_ANALYSIS_SAMPLES, Math.max(6, Math.ceil(duration / ANALYSIS_INTERVAL_SECONDS)));
  return Array.from({ length: count }, (_, index) => (index + 0.5) * duration / count);
}

export function aggregateCategorySuggestions(observations: Observation[], known: { id: string; name: string; nameEn?: string }[]) {
  const vocabulary = new Map(known.map(category => [normalizedCategoryName(category.name), category]));
  const collected = new Map<string, { name: string; nameEn?: string; normalizedName: string; scores: number[]; evidence: number[]; categoryId: string | null }>();
  for (const observation of observations) {
    if (observation.tags.uncertain) continue;
    const seen = new Set<string>();
    for (const tag of observation.tags.tags) {
      if (tag.confidence < MIN_CATEGORY_SCORE) continue;
      const key = normalizedCategoryName(tag.name);
      if (seen.has(key)) continue;
      seen.add(key);
      const existing = vocabulary.get(key);
      const entry = collected.get(key) ?? { name: existing?.name ?? tag.name, ...(existing?.nameEn || tag.nameEn ? { nameEn: existing?.nameEn || tag.nameEn } : {}), normalizedName: key, scores: [], evidence: [], categoryId: existing?.id ?? null };
      entry.scores.push(tag.confidence);
      if (entry.evidence.length < 24) entry.evidence.push(observation.atSeconds);
      collected.set(key, entry);
    }
  }
  return [...collected.values()]
    .filter(entry => entry.categoryId !== null || new Set(entry.evidence).size >= 2 || Math.max(...entry.scores) >= SINGLE_SEGMENT_NEW_CATEGORY_SCORE)
    .map(({ scores, ...entry }) => ({ ...entry, confidence: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => b.evidence.length - a.evidence.length || b.confidence - a.confidence).slice(0, 40);
}
