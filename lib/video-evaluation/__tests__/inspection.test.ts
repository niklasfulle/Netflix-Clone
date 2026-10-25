import { diagnoseSample } from '../inspection';
import type { ClassificationDiagnostics } from '@/lib/video-analysis/diagnostics';
const label = { categoryId: 'nature', name: 'Natur', nameEn: 'Nature', verdict: 'PRESENT' as const };
const tag = { name: 'Natur', nameEn: 'Nature', confidence: 0.9 };
const empty = { tags: [], uncertain: false };
const trace: ClassificationDiagnostics = { schemaVersion: 1, discovered: empty, matched: empty, matchingVocabulary: ['Natur'], selectionLimit: 5 };
test('requires a human visibility review to attribute a miss to sampling', () => {
  expect(diagnoseSample([label], empty, trace, 0.65)[0].reason).toBe('NOT_RETURNED');
  expect(diagnoseSample([label], empty, trace, 0.65, [{ categoryId: 'nature', visibility: 'NOT_VISIBLE' }])[0].reason).toBe('SAMPLING');
});
test('separates a selected low score from a prediction dropped during selection', () => {
  const low = { tags: [{ ...tag, confidence: 0.5 }], uncertain: false };
  expect(diagnoseSample([label], low, trace, 0.65)[0].reason).toBe('BELOW_THRESHOLD');
  expect(diagnoseSample([label], low, trace, 0.4)[0].outcome).toBe('tp');
  expect(diagnoseSample([label], empty, { ...trace, discovered: low }, 0.65)[0].reason).toBe('SELECTION');
  expect(diagnoseSample([label], empty, { ...trace, discovered: { tags: [tag], uncertain: false } }, 0.65)[0].reason).toBe('SELECTION');
});
test('explains vocabulary omission and abstention without inventing synonyms', () => {
  expect(diagnoseSample([label], empty, { ...trace, matchingVocabulary: [] }, 0.65)[0].reason).toBe('OUTSIDE_VOCABULARY');
  expect(diagnoseSample([label], { ...empty, uncertain: true }, trace, 0.65)[0].reason).toBe('ABSTAINED');
  expect(diagnoseSample([label], { tags: [{ name: 'Landschaft', nameEn: 'Landscape', confidence: 0.9 }], uncertain: false }, trace, 0.65)[0].reason).toBe('NOT_RETURNED');
});
test('flags a contradictory absent judgment without changing it', () => {
  const results = diagnoseSample([{ ...label, verdict: 'ABSENT' }], { tags: [tag], uncertain: false }, trace, 0.65, [{ categoryId: 'nature', visibility: 'VISIBLE' }]);
  expect(results[0]).toMatchObject({ reason: 'JUDGMENT_CONFLICT', outcome: 'fp', verdict: 'ABSENT' });
});
