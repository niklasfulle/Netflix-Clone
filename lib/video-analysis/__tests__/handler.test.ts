/** @jest-environment node */
jest.mock('@/lib/db', () => ({ db: { videoAnalysis: { findUnique: jest.fn(), updateMany: jest.fn() } } }));
jest.mock('../model', () => ({ videoAnalysisEnabled: () => true, classifyVideoFrames: jest.fn() }));
jest.mock('../source', () => ({ inspectAnalysisSource: jest.fn(), captureAnalysisFrame: jest.fn() }));
jest.mock('@/lib/media-probe', () => ({ createFfprobe: jest.fn() }));

import { db } from '@/lib/db';
import { inspectAnalysisSource } from '../source';
import { runVideoAnalysis } from '../handler';

test('rejects old partial analyses before reading media or mixing different sampling profiles', async () => {
  jest.mocked(db.videoAnalysis.findUnique).mockResolvedValue({ id: 'analysis', movieId: 'movie', requestedById: 'admin', model: 'old-profile', samples: [], movie: {} } as never);
  jest.mocked(db.videoAnalysis.updateMany).mockResolvedValue({ count: 1 });
  await expect(runVideoAnalysis({ analysisId: 'analysis', contentId: 'movie' }, {
    jobRunId: 'job', actorUserId: 'admin', assertLease: jest.fn(), reportProgress: jest.fn(),
  })).rejects.toMatchObject({ code: 'ANALYSIS_PROFILE_CHANGED', permanent: true });
  expect(inspectAnalysisSource).not.toHaveBeenCalled();
  expect(db.videoAnalysis.updateMany).toHaveBeenCalledWith({ where: { id: 'analysis' }, data: { status: 'FAILED', errorCode: 'ANALYSIS_PROFILE_CHANGED' } });
});
