/** @jest-environment node */
import { JOB_NAMES, parseJobSubmission, parseQueuedJob, parseJobResult } from '@/lib/jobs/contracts';
import { jobQueueOptions } from '@/lib/jobs/submission';
test('evaluation jobs are bounded, target-checked and contain no judgments or media', () => {
  const input = { name: JOB_NAMES.videoEvaluation, version: 1, payload: { evaluationId: 'evaluation-123' }, actor: { userId: 'admin-user', role: 'ADMIN' }, target: { type: 'video_evaluation', id: 'evaluation-123' }, idempotencyKey: 'request-123', correlationId: 'correlation-123' };
  expect(parseJobSubmission(input).name).toBe(JOB_NAMES.videoEvaluation);
  expect(() => parseJobSubmission({ ...input, target: { ...input.target, id: 'different-123' } })).toThrow();
  expect(() => parseJobSubmission({ ...input, payload: { ...input.payload, labels: [] } })).toThrow();
  expect(parseQueuedJob({ ...input, jobRunId: 'job-run-123', acceptedAt: new Date().toISOString() }).name).toBe(JOB_NAMES.videoEvaluation);
  expect(parseJobResult({ evaluationId: 'evaluation-123', processedCount: 24, skippedCount: 0, status: 'EVALUATED' })).toMatchObject({ processedCount: 24 });
  expect(jobQueueOptions({ jobName: JOB_NAMES.videoEvaluation, queueJobId: 'queue-123', singletonKey: 'request-123', database: {} as never })).toMatchObject({ deadLetter: JOB_NAMES.videoEvaluationDeadLetter, expireInSeconds: 21600 });
});
