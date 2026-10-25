/** @jest-environment node */
jest.mock('@/lib/db', () => ({ db: { videoEvaluation: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() }, videoEvaluationSample: { update: jest.fn() }, movie: { findUnique: jest.fn() }, user: { findUnique: jest.fn() }, jobRun: { findUnique: jest.fn() } } }));
jest.mock('@/lib/video-analysis/model', () => ({ videoAnalysisEnabled: () => true, classifyVideoFrames: jest.fn() }));
jest.mock('@/lib/video-analysis/source', () => ({ inspectAnalysisSource: jest.fn(), captureAnalysisFrame: jest.fn() }));
jest.mock('@/lib/user-access', () => ({ hasActiveUserBlock: jest.fn().mockResolvedValue(false) }));
jest.mock('@/lib/media-probe', () => ({ createFfprobe: () => async () => ({ durationSeconds: 100 }) }));
import { db } from '@/lib/db';
import { classifyVideoFrames } from '@/lib/video-analysis/model';
import { captureAnalysisFrame, inspectAnalysisSource } from '@/lib/video-analysis/source';
import { currentAnalysisProfileId } from '@/lib/video-analysis/runtime-profile';
import { runVideoEvaluation } from '../handler';
const context = { jobRunId: 'job', actorUserId: 'admin', assertLease: jest.fn(), reportProgress: jest.fn() };
const sample = { id: 'sample', movieId: 'movie', sourceFingerprint: 'current', startSeconds: 30, endSeconds: 36, status: 'PENDING' };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(db.videoEvaluation.findUnique).mockResolvedValue({ id: 'evaluation', requestedById: 'admin', model: currentAnalysisProfileId(), vocabulary: [{ id: 'nature', name: 'Natur', nameEn: 'Nature' }], samples: [sample] } as never);
  jest.mocked(db.user.findUnique).mockResolvedValue({ id: 'admin', role: 'ADMIN' } as never);
  jest.mocked(db.jobRun.findUnique).mockResolvedValue({ status: 'RUNNING' } as never);
  jest.mocked(db.movie.findUnique).mockResolvedValue({ type: 'Movie', videoUrl: 'neutral.mp4' } as never);
  jest.mocked(db.videoEvaluation.updateMany).mockResolvedValue({ count: 1 });
  jest.mocked(inspectAnalysisSource).mockResolvedValue({ filePath: '/movies/neutral.mp4', fingerprint: 'current' });
  jest.mocked(captureAnalysisFrame).mockResolvedValue(Buffer.from('frame'));
  jest.mocked(classifyVideoFrames).mockResolvedValue({ tags: [{ name: 'Natur', nameEn: 'Nature', confidence: 0.9 }], uncertain: false });
});
test('captures only inside the marked interval and saves predictions without passing judgments to the model', async () => {
  const result = await runVideoEvaluation({ evaluationId: 'evaluation' }, context);
  expect(result).toMatchObject({ processedCount: 1, skippedCount: 0, status: 'EVALUATED' });
  expect(jest.mocked(captureAnalysisFrame).mock.calls.map(call => call[1])).toEqual([31, 33, 35]);
  expect(classifyVideoFrames).toHaveBeenCalledWith(expect.any(Array), ['Natur'], expect.any(AbortSignal));
  expect(db.videoEvaluationSample.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED', tags: expect.any(Object) }) }));
});
test('skips changed sources without sending frames to the model', async () => {
  jest.mocked(inspectAnalysisSource).mockResolvedValue({ filePath: '/movies/neutral.mp4', fingerprint: 'changed' });
  expect(await runVideoEvaluation({ evaluationId: 'evaluation' }, context)).toMatchObject({ skippedCount: 1 });
  expect(classifyVideoFrames).not.toHaveBeenCalled();
  expect(db.videoEvaluationSample.update).toHaveBeenCalledWith({ where: { id: 'sample' }, data: { status: 'STALE' } });
});
test('a changed file during inference never receives a score', async () => {
  jest.mocked(inspectAnalysisSource).mockResolvedValueOnce({ filePath: '/movies/neutral.mp4', fingerprint: 'current' }).mockResolvedValueOnce({ filePath: '/movies/neutral.mp4', fingerprint: 'changed' });
  await runVideoEvaluation({ evaluationId: 'evaluation' }, context);
  expect(db.videoEvaluationSample.update).toHaveBeenCalledWith({ where: { id: 'sample' }, data: { status: 'STALE' } });
});
test('resuming a partial run does not repeat completed inference', async () => {
  jest.mocked(db.videoEvaluation.findUnique).mockResolvedValue({ id: 'evaluation', requestedById: 'admin', model: currentAnalysisProfileId(), vocabulary: [], samples: [{ ...sample, status: 'COMPLETED' }] } as never);
  await runVideoEvaluation({ evaluationId: 'evaluation' }, context);
  expect(classifyVideoFrames).not.toHaveBeenCalled();
});
test('cancellation and lost administrator access stop before capture', async () => {
  jest.mocked(db.jobRun.findUnique).mockResolvedValue({ status: 'CANCEL_REQUESTED' } as never);
  await expect(runVideoEvaluation({ evaluationId: 'evaluation' }, context)).rejects.toMatchObject({ code: 'ANALYSIS_CANCELLED' });
  expect(captureAnalysisFrame).not.toHaveBeenCalled();
  jest.mocked(db.jobRun.findUnique).mockResolvedValue({ status: 'RUNNING' } as never);
  jest.mocked(db.user.findUnique).mockResolvedValue({ role: 'USER' } as never);
  await expect(runVideoEvaluation({ evaluationId: 'evaluation' }, context)).rejects.toMatchObject({ code: 'ADMIN_ACCESS_LOST' });
});
