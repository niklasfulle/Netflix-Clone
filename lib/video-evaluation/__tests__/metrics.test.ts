import { samplePositions, scoreSample, summarizeEvaluation, type EvaluationSample } from '../metrics';
import type { ExampleLabel } from '@/lib/video-examples/types';
const label = (categoryId: string, name: string, verdict: ExampleLabel['verdict']): ExampleLabel => ({ categoryId, name, nameEn: name, verdict });
test('scores only explicit judgments, ignores unreviewed predictions and normalizes bilingual names', () => {
  const results = scoreSample([label('one', ' Nature ', 'PRESENT'), label('two', 'City', 'ABSENT'), label('three', 'Sea', 'UNCERTAIN'), label('four', 'Forest', 'PRESENT'), label('five', 'Desert', 'ABSENT')], {
    tags: [{ name: 'Natur', nameEn: 'nature', confidence: 0.9 }, { name: 'City', confidence: 0.8 }, { name: 'Sea', confidence: 0.99 }, { name: 'Mountains', confidence: 0.9 }], uncertain: false,
  });
  expect(results.map(result => result.outcome)).toEqual(['tp', 'fp', 'fn', 'tn']);
});
test('model abstention and predictions below the saved threshold miss present labels', () => {
  const labels = [label('one', 'Nature', 'PRESENT')];
  const tags = { tags: [{ name: 'Nature', confidence: 0.8 }], uncertain: false };
  expect(scoreSample(labels, tags, 0.9)[0].outcome).toBe('fn');
  expect(scoreSample(labels, { ...tags, uncertain: true })[0].outcome).toBe('fn');
  expect(scoreSample(labels, tags, 0.7)[0].outcome).toBe('tp');
});
test('summary excludes stale and pending samples and counts categories by stable ID', () => {
  const sample: EvaluationSample = { id: 'sample', movieId: 'movie', exampleId: 'example', exampleVersion: 1, startSeconds: 0, endSeconds: 6, status: 'COMPLETED', labels: [label('one', 'Nature', 'PRESENT'), label('two', 'City', 'ABSENT')], tags: { tags: [{ name: 'Nature', confidence: 0.9 }, { name: 'City', confidence: 0.9 }], uncertain: false } };
  const summary = summarizeEvaluation([sample, { ...sample, status: 'STALE' }, { ...sample, status: 'PENDING' }]);
  expect(summary).toMatchObject({ tp: 1, fp: 1, fn: 0, tn: 0, precision: 0.5, recall: 1, completed: 1, skipped: 1 });
  expect(summary.f1).toBeCloseTo(2 / 3);
  expect(summary.categories).toHaveLength(2);
});
test('undefined rates remain undefined rather than inventing perfect scores', () => {
  expect(summarizeEvaluation([])).toMatchObject({ precision: null, recall: null, f1: null });
});
test('captures three positions strictly inside the marked interval', () => {
  expect(samplePositions(30, 36)).toEqual([31, 33, 35]);
  expect(() => samplePositions(5, 5)).toThrow('INVALID_TIME_RANGE');
  expect(() => samplePositions(-1, 5)).toThrow('INVALID_TIME_RANGE');
});
