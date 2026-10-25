import { normalizedCategoryName, type FrameTags } from '@/lib/video-analysis/contracts';
import type { ExampleLabel } from '@/lib/video-examples/types';
import { MIN_CATEGORY_SCORE } from '@/lib/video-analysis/profile';

export const MAX_EVALUATION_SAMPLES = 500;
export type Counts = { tp: number; fp: number; fn: number; tn: number };
export type EvaluationSample = { id: string; movieId: string; movieTitle?: string; exampleId: string; exampleVersion: number; startSeconds: number; endSeconds: number; labels: ExampleLabel[]; status: string; tags: FrameTags | null };
export type Outcome = 'tp' | 'fp' | 'fn' | 'tn';
export function samplePositions(start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) throw new Error('INVALID_TIME_RANGE');
  return [1 / 6, 1 / 2, 5 / 6].map(fraction => start + (end - start) * fraction);
}
export function scoreSample(labels: ExampleLabel[], tags: FrameTags, threshold = MIN_CATEGORY_SCORE) {
  const predicted = new Set(tags.uncertain ? [] : tags.tags.filter(tag => tag.confidence >= threshold).flatMap(tag => [tag.name, tag.nameEn || '']).filter(Boolean).map(normalizedCategoryName));
  return labels.filter(label => label.verdict !== 'UNCERTAIN').map(label => {
    const found = [label.name, label.nameEn].filter(Boolean).some(name => predicted.has(normalizedCategoryName(name)));
    const outcome: Outcome = label.verdict === 'PRESENT' ? found ? 'tp' : 'fn' : found ? 'fp' : 'tn';
    return { ...label, outcome };
  });
}
function metrics(counts: Counts) {
  const { tp, fp, fn } = counts;
  return { ...counts, precision: tp + fp ? tp / (tp + fp) : null, recall: tp + fn ? tp / (tp + fn) : null, f1: 2 * tp + fp + fn ? 2 * tp / (2 * tp + fp + fn) : null };
}
export function summarizeEvaluation(samples: EvaluationSample[], threshold = MIN_CATEGORY_SCORE) {
  const total: Counts = { tp: 0, fp: 0, fn: 0, tn: 0 };
  const categories = new Map<string, Counts & { categoryId: string; name: string; nameEn: string }>();
  for (const sample of samples) {
    if (sample.status !== 'COMPLETED' || !sample.tags) continue;
    for (const result of scoreSample(sample.labels, sample.tags, threshold)) {
      const counts = categories.get(result.categoryId) ?? { categoryId: result.categoryId, name: result.name, nameEn: result.nameEn, tp: 0, fp: 0, fn: 0, tn: 0 };
      counts[result.outcome]++; total[result.outcome]++; categories.set(result.categoryId, counts);
    }
  }
  return { ...metrics(total), completed: samples.filter(sample => sample.status === 'COMPLETED').length,
    skipped: samples.filter(sample => sample.status === 'STALE' || sample.status === 'UNAVAILABLE').length,
    categories: [...categories.values()].map(category => ({ ...category, ...metrics(category) })) };
}
