import { z } from 'zod';
import { MIN_CATEGORY_SCORE } from './profile';
import { SAMPLING_PROFILES, type SamplingProfileId } from './sampling';
export { MAX_ANALYSIS_SAMPLES } from './sampling';

export const VIDEO_ANALYSIS_MODEL = 'qwen3-vl-4b-q4km-1cd86afb-catalog-v6';
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

export function analysisSampleTimes(duration: number, profileId: SamplingProfileId = 'standard-v1'): number[] {
  if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 3600) throw new VideoAnalysisError('INVALID_VIDEO_DURATION', true);
  const profile = Object.values(SAMPLING_PROFILES).find(candidate => candidate.id === profileId);
  if (!profile) throw new VideoAnalysisError('INVALID_SAMPLING_PROFILE', true);
  const count = Math.min(profile.maxSamples, Math.max(profile.minSamples, Math.ceil(duration / profile.intervalSeconds)));
  return Array.from({ length: count }, (_, index) => (index + 0.5) * duration / count);
}

export function aggregateCategorySuggestions(observations: Observation[], known: { id: string; name: string; nameEn?: string }[]) {
  const vocabulary = new Map(known.map(category => [normalizedCategoryName(category.name), category]));
  const collected = new Map<string, { name: string; nameEn?: string; normalizedName: string; scores: number[]; evidence: number[]; categoryId: string }>();
  for (const observation of observations) {
    if (observation.tags.uncertain) continue;
    const seen = new Set<string>();
    for (const tag of observation.tags.tags) {
      if (tag.confidence < MIN_CATEGORY_SCORE) continue;
      const key = normalizedCategoryName(tag.name);
      if (seen.has(key)) continue;
      seen.add(key);
      const existing = vocabulary.get(key);
      if (!existing) continue;
      const entry = collected.get(key) ?? { name: existing.name, ...(existing.nameEn ? { nameEn: existing.nameEn } : {}), normalizedName: key, scores: [], evidence: [], categoryId: existing.id };
      entry.scores.push(tag.confidence);
      if (entry.evidence.length < 24) entry.evidence.push(observation.atSeconds);
      collected.set(key, entry);
    }
  }
  return [...collected.values()]
    .map(({ scores, ...entry }) => ({ ...entry, confidence: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => b.evidence.length - a.evidence.length || b.confidence - a.confidence).slice(0, 40);
}
