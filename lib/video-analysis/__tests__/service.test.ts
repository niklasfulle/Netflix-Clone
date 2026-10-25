/** @jest-environment node */
jest.mock('@/lib/db', () => ({ db: { movie: { findUnique: jest.fn() }, videoAnalysis: { upsert: jest.fn(), update: jest.fn(), updateMany: jest.fn() }, category: { upsert: jest.fn() }, $transaction: jest.fn() } }));
jest.mock('@/lib/jobs/runtime', () => ({ backgroundJobSubmission: { submit: jest.fn() } }));
jest.mock('../model', () => ({ analysisModelAvailable: jest.fn(), videoAnalysisEnabled: jest.fn() }));
jest.mock('../source', () => ({ inspectAnalysisSource: jest.fn() }));

import { db } from '@/lib/db';
import { backgroundJobSubmission } from '@/lib/jobs/runtime';
import { analysisModelAvailable, videoAnalysisEnabled } from '../model';
import { inspectAnalysisSource } from '../source';
import { reviewVideoSuggestions, submitVideoAnalysis } from '../service';

const transaction = {
  $queryRaw: jest.fn(),
  videoAnalysis: { findUnique: jest.fn() }, movie: { findUnique: jest.fn() },
  videoCategorySuggestion: { findMany: jest.fn(), update: jest.fn() },
  category: { findUnique: jest.fn(), upsert: jest.fn() },
  movieCategory: { findUnique: jest.fn(), count: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
};
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(videoAnalysisEnabled).mockReturnValue(true);
  jest.mocked(analysisModelAvailable).mockResolvedValue(true);
  jest.mocked(inspectAnalysisSource).mockResolvedValue({ filePath: '/movies/test.mp4', fingerprint: 'fingerprint' });
  jest.mocked(db.movie.findUnique).mockResolvedValue({ id: 'movie-1', type: 'Movie', videoUrl: 'test.mp4' } as never);
  jest.mocked(db.videoAnalysis.upsert).mockResolvedValue({ id: 'analysis-123', requestedById: 'admin-123', status: 'QUEUED', jobRunId: null } as never);
  jest.mocked(backgroundJobSubmission.submit).mockResolvedValue({ id: 'job-12345', queueJobId: 'queue-123', status: 'QUEUED', duplicate: false, correlationId: 'correlation' });
  (db.$transaction as jest.Mock).mockImplementation((callback) => callback(transaction));
  transaction.videoAnalysis.findUnique.mockResolvedValue({ id: 'analysis-123', movieId: 'movie-1', sourceFingerprint: 'fingerprint', status: 'SUCCEEDED', jobRun: { status: 'SUCCEEDED' } });
  transaction.movie.findUnique.mockResolvedValue({ id: 'movie-1', type: 'Movie', videoUrl: 'test.mp4' });
  transaction.videoCategorySuggestion.findMany.mockResolvedValue([{ id: 'suggestion', name: 'Outdoor', nameEn: 'Outdoors', normalizedName: 'outdoor', state: 'PENDING', categoryId: null }]);
  transaction.category.upsert.mockResolvedValue({ id: 'new-category' });
  transaction.movieCategory.count.mockResolvedValue(2);
});

it('queues analysis without creating categories or assigning anything automatically', async () => {
  const result = await submitVideoAnalysis('movie-1', 'admin-123');
  expect(result.analysisId).toBe('analysis-123');
  expect(backgroundJobSubmission.submit).toHaveBeenCalledWith(expect.objectContaining({ name: 'video.categories.analyze', payload: { analysisId: 'analysis-123', contentId: 'movie-1' } }));
  expect(db.category.upsert).not.toHaveBeenCalled();
});

it('reuses completed analyses even after the queue record has been retained away', async () => {
  jest.mocked(db.videoAnalysis.upsert).mockResolvedValue({ id: 'analysis-123', status: 'SUCCEEDED', jobRunId: null } as never);
  expect(await submitVideoAnalysis('movie-1', 'admin-123')).toEqual({ analysisId: 'analysis-123', jobRunId: null, duplicate: true });
  expect(backgroundJobSubmission.submit).not.toHaveBeenCalled();
});

it('deduplicates accepted jobs and supports an explicit fresh analysis', async () => {
  jest.mocked(db.videoAnalysis.upsert).mockResolvedValue({ id: 'analysis-123', status: 'RUNNING', jobRunId: 'job-12345' } as never);
  await submitVideoAnalysis('movie-1', 'admin-123');
  await submitVideoAnalysis('movie-1', 'admin-123', true);
  const calls = jest.mocked(db.videoAnalysis.upsert).mock.calls;
  expect(calls[0][0].where.cacheKey).not.toEqual(calls[1][0].where.cacheKey);
  expect(backgroundJobSubmission.submit).not.toHaveBeenCalled();
});

it('does not queue work when the model is unavailable', async () => {
  jest.mocked(analysisModelAvailable).mockResolvedValue(false);
  await expect(submitVideoAnalysis('movie-1', 'admin-123')).rejects.toHaveProperty('code', 'MODEL_UNAVAILABLE');
  expect(db.videoAnalysis.upsert).not.toHaveBeenCalled();
});

it('merges approved categories into existing assignments and records approval', async () => {
  expect(await reviewVideoSuggestions('analysis-123', ['suggestion'], 'ACCEPT')).toEqual({ changed: 1, movieId: 'movie-1' });
  expect(transaction.category.upsert).toHaveBeenCalledWith({ where: { normalizedName: 'outdoor' }, update: {}, create: { name: 'Outdoor', nameEn: 'Outdoors', normalizedName: 'outdoor' } });
  expect(transaction.movieCategory.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { movieId: 'movie-1', categoryId: 'new-category' } }));
  expect(transaction.movieCategory.deleteMany).not.toHaveBeenCalled();
  expect(transaction.videoCategorySuggestion.update).toHaveBeenCalledWith({ where: { id: 'suggestion' }, data: { state: 'ACCEPTED', categoryId: 'new-category' } });
});

it('keeps renamed existing categories linked by their stable IDs', async () => {
  transaction.videoCategorySuggestion.findMany.mockResolvedValue([{ id: 'suggestion', categoryId: 'existing', state: 'PENDING' }]);
  transaction.category.findUnique.mockResolvedValue({ id: 'existing', name: 'Renamed' });
  await reviewVideoSuggestions('analysis-123', ['suggestion'], 'ACCEPT');
  expect(transaction.category.upsert).not.toHaveBeenCalled();
  expect(transaction.movieCategory.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { movieId: 'movie-1', categoryId: 'existing' } }));
});

it('rejects suggestions without creating categories and makes repeated reviews idempotent', async () => {
  await reviewVideoSuggestions('analysis-123', ['suggestion'], 'REJECT');
  expect(transaction.category.upsert).not.toHaveBeenCalled();
  expect(transaction.videoCategorySuggestion.update).toHaveBeenCalledWith({ where: { id: 'suggestion' }, data: { state: 'REJECTED' } });
  transaction.videoCategorySuggestion.findMany.mockResolvedValue([{ id: 'suggestion', state: 'ACCEPTED' }]);
  expect(await reviewVideoSuggestions('analysis-123', ['suggestion'], 'ACCEPT')).toHaveProperty('changed', 0);
});

it('refuses stale videos, cancelled jobs and suggestion IDs belonging to other analyses', async () => {
  jest.mocked(inspectAnalysisSource).mockResolvedValueOnce({ filePath: '/movies/test.mp4', fingerprint: 'changed' });
  await expect(reviewVideoSuggestions('analysis-123', ['suggestion'], 'ACCEPT')).rejects.toHaveProperty('code', 'VIDEO_CHANGED');
  transaction.videoAnalysis.findUnique.mockResolvedValueOnce({ status: 'SUCCEEDED', jobRun: { status: 'CANCELLED' } });
  await expect(reviewVideoSuggestions('analysis-123', ['suggestion'], 'ACCEPT')).rejects.toHaveProperty('code', 'ANALYSIS_NOT_READY');
  transaction.videoCategorySuggestion.findMany.mockResolvedValueOnce([]);
  await expect(reviewVideoSuggestions('analysis-123', ['foreign'], 'ACCEPT')).rejects.toHaveProperty('code', 'INVALID_SUGGESTIONS');
  expect(transaction.movieCategory.upsert).not.toHaveBeenCalled();
});
