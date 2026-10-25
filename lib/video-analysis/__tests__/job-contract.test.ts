/** @jest-environment node */
import { parseJobSubmission, parseJobResult } from '@/lib/jobs/contracts';

const submission = {
  name: 'video.categories.analyze', version: 1,
  payload: { analysisId: 'analysis-id', contentId: 'movie-id' },
  actor: { userId: 'admin-id', role: 'ADMIN' }, target: { type: 'content', id: 'movie-id' },
  idempotencyKey: 'analysis-id', correlationId: 'correlation-id',
};
test('accepts a bounded video analysis job and its result', () => {
  expect(parseJobSubmission(submission)).toEqual(submission);
  expect(parseJobResult({ analysisId: 'analysis-id', suggestionCount: 2, sampleCount: 6, status: 'READY' })).toMatchObject({ status: 'READY' });
});
test('rejects mismatched content ownership, non-admin execution and oversized results', () => {
  expect(() => parseJobSubmission({ ...submission, target: { type: 'content', id: 'other-movie' } })).toThrow();
  expect(() => parseJobSubmission({ ...submission, actor: { userId: 'user-id', role: 'USER' } })).toThrow();
  expect(() => parseJobResult({ analysisId: 'analysis-id', suggestionCount: 41, sampleCount: 6, status: 'READY' })).toThrow();
});
