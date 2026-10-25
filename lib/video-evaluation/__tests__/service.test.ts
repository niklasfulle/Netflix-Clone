/** @jest-environment node */
jest.mock('@/lib/db', () => ({ db: { videoEvaluation: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() }, videoExample: { findMany: jest.fn() }, category: { findMany: jest.fn() }, $transaction: jest.fn() } }));
jest.mock('@/lib/jobs/runtime', () => ({ backgroundJobSubmission: { submit: jest.fn() } }));
jest.mock('@/lib/video-analysis/model', () => ({ videoAnalysisEnabled: () => true, analysisModelAvailable: jest.fn().mockResolvedValue(true) }));
import { db } from '@/lib/db';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import { submitVideoEvaluation } from '../service';
const saved = { id: 'evaluation-123', requestedById: 'admin-user', status: 'QUEUED', jobRunId: null };
const example = { id: 'example', movieId: 'movie', version: 3, sourceFingerprint: 'fingerprint', startSeconds: 1, endSeconds: 4, labels: [{ categoryId: 'nature', name: 'Natur', nameEn: 'Nature', verdict: 'PRESENT' }], note: 'Not passed to the model' };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(db.videoEvaluation.findUnique).mockResolvedValue(null);
  jest.mocked(db.videoExample.findMany).mockResolvedValue([example] as never);
  jest.mocked(db.category.findMany).mockResolvedValue([{ id: 'nature', name: 'Natur', nameEn: 'Nature' }] as never);
  jest.mocked(db.videoEvaluation.upsert).mockResolvedValue(saved as never);
  jest.mocked(backgroundJobSubmission.submit).mockResolvedValue({ id: 'job-run-123', duplicate: false } as never);
  jest.mocked(db.$transaction).mockImplementation(async (callback: unknown) => (callback as (client: typeof db) => Promise<unknown>)(db) as never);
});
test('snapshots versions, judgments and source bounds and queues only the evaluation ID', async () => {
  expect(await submitVideoEvaluation('request', 'admin-user')).toMatchObject({ evaluationId: saved.id, duplicate: false });
  expect(db.videoEvaluation.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ samples: { create: [expect.objectContaining({ exampleVersion: 3, labels: example.labels, sourceFingerprint: 'fingerprint' })] } }) }));
  expect(backgroundJobSubmission.submit).toHaveBeenCalledWith(expect.objectContaining({ payload: { evaluationId: saved.id }, actor: { userId: 'admin-user', role: 'ADMIN' } }));
  expect(JSON.stringify(jest.mocked(backgroundJobSubmission.submit).mock.calls)).not.toContain(example.note);
});
test('a repeated request reuses the existing run without recapturing changed judgments', async () => {
  jest.mocked(db.videoEvaluation.findUnique).mockResolvedValue({ ...saved, jobRunId: 'job-run-123' } as never);
  expect(await submitVideoEvaluation('request', 'admin-user')).toMatchObject({ duplicate: true });
  expect(db.videoExample.findMany).not.toHaveBeenCalled(); expect(backgroundJobSubmission.submit).not.toHaveBeenCalled();
});
test('uncertain-only datasets cannot produce misleading empty scores', async () => {
  jest.mocked(db.videoExample.findMany).mockResolvedValue([{ ...example, labels: [{ ...example.labels[0], verdict: 'UNCERTAIN' }] }] as never);
  await expect(submitVideoEvaluation('request', 'admin-user')).rejects.toMatchObject({ code: 'NO_REVIEWED_EXAMPLES' });
  expect(backgroundJobSubmission.submit).not.toHaveBeenCalled();
});
test('excess examples are rejected rather than silently truncating the dataset', async () => {
  jest.mocked(db.videoExample.findMany).mockResolvedValue(Array.from({ length: 501 }, () => example) as never);
  await expect(submitVideoEvaluation('request', 'admin-user')).rejects.toMatchObject({ code: 'EVALUATION_LIMIT' });
});
