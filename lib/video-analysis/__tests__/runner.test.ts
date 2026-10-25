/** @jest-environment node */
import { aggregateCategorySuggestions, analysisSampleTimes, frameTagsSchema } from '../contracts';
import { analyzeVideoSegments } from '../runner';

const tags = { tags: [{ name: 'Documentary', confidence: 0.8 }], uncertain: false };

it('samples the entire timeline and bounds long-video work', () => {
  expect(analysisSampleTimes(12)).toEqual([1, 3, 5, 7, 9, 11]);
  const long = analysisSampleTimes(8 * 3600);
  expect(long).toHaveLength(120);
  expect(long[119]).toBeGreaterThan(7.9 * 3600);
  expect(() => analysisSampleTimes(Number.NaN)).toThrow();
  expect(() => analysisSampleTimes(0)).toThrow();
});

it('merges category names, preserves known IDs and collects only observed evidence', () => {
  const output = aggregateCategorySuggestions([
    { atSeconds: 5, tags: { tags: [{ name: '  Documentary ', confidence: 0.8 }, { name: 'documentary', confidence: 0.9 }, { name: 'Uncertain', confidence: 0.2 }], uncertain: false } },
    { atSeconds: 35, tags: { tags: [{ name: 'DOCUMENTARY', confidence: 0.7 }, { name: 'Outdoor', confidence: 0.9 }], uncertain: false } },
    { atSeconds: 65, tags: { tags: [{ name: 'Guess', confidence: 0.99 }], uncertain: true } },
  ], [{ id: 'known', name: 'Documentary' }]);
  expect(output[0]).toEqual(expect.objectContaining({ categoryId: 'known', name: 'Documentary', evidence: [5, 35] }));
  expect(output[0].confidence).toBeCloseTo(0.75);
  expect(output[1]).toEqual(expect.objectContaining({ name: 'Outdoor', categoryId: null, evidence: [35] }));
  expect(output).toHaveLength(2);
});

it('rejects malformed, excessive or unbounded model tags', () => {
  expect(frameTagsSchema.safeParse({ ...tags, tags: [{ name: 'x', confidence: 4 }] }).success).toBe(false);
  expect(frameTagsSchema.safeParse({ ...tags, tags: [{ name: 'x'.repeat(81), confidence: 0.9 }] }).success).toBe(false);
  expect(frameTagsSchema.safeParse({ ...tags, tags: Array(6).fill(tags.tags[0]) }).success).toBe(false);
});

it('resumes from persisted samples and captures three frames per missing segment', async () => {
  const capture = jest.fn(async () => Buffer.from('image'));
  const classify = jest.fn(async () => tags);
  const save = jest.fn();
  const progress = jest.fn();
  const observations = await analyzeVideoSegments({ duration: 12, previous: [{ index: 0, atSeconds: 1, tags }], capture, classify, save, progress, checkpoint: async () => {} });
  expect(capture).toHaveBeenCalledTimes(15);
  expect(classify).toHaveBeenCalledTimes(5);
  expect(capture.mock.calls[0]).toEqual([1]);
  expect(save).toHaveBeenCalledTimes(5);
  expect(progress).toHaveBeenLastCalledWith(6, 6);
  expect(observations).toHaveLength(6);
});

it('stops before inference when cancellation or permission checks fail', async () => {
  const classify = jest.fn();
  const save = jest.fn();
  await expect(analyzeVideoSegments({ duration: 12, previous: [], capture: jest.fn(), classify, save, progress: jest.fn(), checkpoint: async () => { throw new Error('cancelled'); } })).rejects.toThrow('cancelled');
  expect(classify).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
});

it('does not advance progress beyond a sample that failed to persist', async () => {
  const progress = jest.fn();
  await expect(analyzeVideoSegments({ duration: 12, previous: [], capture: async () => Buffer.from('image'), classify: async () => tags, checkpoint: async () => {}, save: async () => { throw new Error('database unavailable'); }, progress })).rejects.toThrow('database unavailable');
  expect(progress).toHaveBeenCalledTimes(1);
});

it('retains corroborated discoveries and strong isolated evidence while rejecting weak isolated guesses', () => {
  const observation = (atSeconds: number, name: string, confidence: number) => ({ atSeconds, tags: { tags: [{ name, confidence }], uncertain: false } });
  const output = aggregateCategorySuggestions([
    observation(10, 'Weak guess', 0.6), observation(10, 'Single guess', 0.8),
    observation(10, 'Repeated discovery', 0.75), observation(30, 'Repeated discovery', 0.8),
    observation(10, 'Strong discovery', 0.95), observation(10, 'Known', 0.7),
    observation(10, 'Duplicate timestamp', 0.8), observation(10, 'Duplicate timestamp', 0.8),
  ], [{ id: 'known-id', name: 'Known' }]);
  expect(output.map(value => value.name).sort()).toEqual(['Known', 'Repeated discovery', 'Strong discovery']);
  expect(analysisSampleTimes(1200)).toHaveLength(60);
});
