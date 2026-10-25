import { z } from 'zod';
import { normalizedCategoryName, type FrameTags } from '@/lib/video-analysis/contracts';
import type { ClassificationDiagnostics } from '@/lib/video-analysis/diagnostics';
import { scoreSample } from './metrics';
import type { ExampleLabel } from '@/lib/video-examples/types';

export const inspectionInput = z.object({
  version: z.number().int().min(0).max(1000000),
  judgments: z.array(z.object({ categoryId: z.string().min(1).max(191), visibility: z.enum(['VISIBLE', 'NOT_VISIBLE', 'UNCERTAIN']) }).strict()).max(50)
    .refine(judgments => new Set(judgments.map(judgment => judgment.categoryId)).size === judgments.length),
}).strict();
export type Visibility = z.infer<typeof inspectionInput>['judgments'][number]['visibility'];
export type DiagnosticReason = 'CORRECT' | 'SAMPLING' | 'JUDGMENT_CONFLICT' | 'BELOW_THRESHOLD' | 'SELECTION' | 'ABSTAINED' | 'OUTSIDE_VOCABULARY' | 'NOT_RETURNED' | 'FALSE_POSITIVE';
export function diagnoseSample(labels: ExampleLabel[], tags: FrameTags, trace: ClassificationDiagnostics, threshold: number, judgments: { categoryId: string; visibility: Visibility }[] = []) {
  return scoreSample(labels, tags, threshold).map(label => {
    const aliases = new Set([label.name, label.nameEn].filter(Boolean).map(normalizedCategoryName));
    const matches = (tag: FrameTags['tags'][number]) => [tag.name, tag.nameEn].filter(Boolean).some(name => aliases.has(normalizedCategoryName(name!)));
    const final = tags.tags.filter(matches);
    const results = trace.schemaVersion === 1 ? [trace.discovered, trace.matched].filter((pass): pass is FrameTags => pass !== null) : trace.passes.map(pass => pass.result);
    const raw = results.flatMap(pass => pass.tags.filter(matches).map(tag => ({ ...tag, uncertain: pass.uncertain })));
    const visibility = judgments.find(judgment => judgment.categoryId === label.categoryId)?.visibility ?? 'UNCERTAIN';
    let reason: DiagnosticReason = 'CORRECT';
    if (label.outcome === 'fn' || label.outcome === 'fp') {
      if (label.verdict === 'PRESENT' && visibility === 'NOT_VISIBLE') reason = 'SAMPLING';
      else if (label.verdict === 'ABSENT' && visibility === 'VISIBLE') reason = 'JUDGMENT_CONFLICT';
      else if (label.outcome === 'fp') reason = 'FALSE_POSITIVE';
      else if (tags.uncertain || raw.length > 0 && raw.every(tag => tag.uncertain)) reason = 'ABSTAINED';
      else if (final.length > 0 && final.every(tag => tag.confidence < threshold)) reason = 'BELOW_THRESHOLD';
      else if (raw.some(tag => !tag.uncertain)) reason = 'SELECTION';
      else if (!trace.matchingVocabulary.some(name => aliases.has(normalizedCategoryName(name)))) reason = 'OUTSIDE_VOCABULARY';
      else reason = 'NOT_RETURNED';
    }
    return { ...label, reason, visibility, confidence: final.length ? Math.max(...final.map(tag => tag.confidence)) : null };
  });
}
