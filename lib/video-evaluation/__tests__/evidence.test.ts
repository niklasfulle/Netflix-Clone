/** @jest-environment node */
jest.mock('@/lib/db', () => ({ db: { videoEvaluationSample: { findFirst: jest.fn(), updateMany: jest.fn() }, videoEvaluationFrame: { findFirst: jest.fn() } } }));
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { readEvaluationEvidence, readEvaluationFrame, reviewEvaluationEvidence } from '../evidence';
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const tags = { tags: [], uncertain: false };
const sample = { id: 'sample-123', status: 'COMPLETED', labels: [{ categoryId: 'nature', name: 'Natur', nameEn: 'Nature', verdict: 'PRESENT' }], tags,
  evaluation: { model: 'neutral-profile', threshold: 0.65 }, inspectionVersion: 0, inspection: null, startSeconds: 0, endSeconds: 6,
  diagnostics: { schemaVersion: 1, discovered: tags, matched: tags, matchingVocabulary: ['Natur'], selectionLimit: 5 },
  frames: [0, 1, 2].map(index => ({ index, atSeconds: index + 1, sha256: createHash('sha256').update(jpeg).digest('hex') })),
};
beforeEach(() => { jest.clearAllMocks(); jest.mocked(db.videoEvaluationSample.findFirst).mockResolvedValue(sample as never); jest.mocked(db.videoEvaluationSample.updateMany).mockResolvedValue({ count: 1 }); });
test('exposes metadata without image bytes, reviewer IDs or source paths', async () => {
  const result = await readEvaluationEvidence('evaluation-123', 'sample-123');
  expect(result.frames).toHaveLength(3);
  expect(result.frames[0].url).toBe('/api/admin/video-evaluations/evaluation-123/samples/sample-123/frames/0');
  expect(JSON.stringify(result)).not.toMatch(/sourceFingerprint|filePath|reviewerId|"jpeg"/);
  expect(db.videoEvaluationSample.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'sample-123', evaluationId: 'evaluation-123' } }));
});
test('legacy evaluations cannot pretend regenerated images are original evidence', async () => {
  jest.mocked(db.videoEvaluationSample.findFirst).mockResolvedValue({ ...sample, frames: [], diagnostics: null } as never);
  await expect(readEvaluationEvidence('evaluation-123', 'sample-123')).rejects.toMatchObject({ code: 'EVIDENCE_UNAVAILABLE' });
});
test('serves only persisted bytes from the selected run and rejects corrupted images', async () => {
  jest.mocked(db.videoEvaluationFrame.findFirst).mockResolvedValue({ jpeg, sha256: createHash('sha256').update(jpeg).digest('hex') } as never);
  expect(await readEvaluationFrame('evaluation-123', 'sample-123', 1)).toEqual(jpeg);
  expect(db.videoEvaluationFrame.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { sampleId: 'sample-123', index: 1, sample: { evaluationId: 'evaluation-123', status: 'COMPLETED' } } }));
  jest.mocked(db.videoEvaluationFrame.findFirst).mockResolvedValue({ jpeg, sha256: 'wrong' } as never);
  await expect(readEvaluationFrame('evaluation-123', 'sample-123', 1)).rejects.toMatchObject({ code: 'EVIDENCE_CORRUPT' });
});
test('saves visibility independently of ground truth with optimistic concurrency', async () => {
  const judgments = [{ categoryId: 'nature', visibility: 'NOT_VISIBLE' }];
  expect(await reviewEvaluationEvidence('evaluation-123', 'sample-123', { version: 0, judgments }, 'admin-user')).toEqual({ version: 1, labelCount: 1 });
  expect(db.videoEvaluationSample.updateMany).toHaveBeenCalledWith({ where: { id: 'sample-123', evaluationId: 'evaluation-123', inspectionVersion: 0 }, data: { inspection: { judgments, reviewerId: 'admin-user', reviewedAt: expect.any(String) }, inspectionVersion: { increment: 1 } } });
  jest.mocked(db.videoEvaluationSample.updateMany).mockResolvedValue({ count: 0 });
  await expect(reviewEvaluationEvidence('evaluation-123', 'sample-123', { version: 0, judgments }, 'admin-user')).rejects.toMatchObject({ code: 'INSPECTION_CONFLICT' });
});
test('saved inspection metadata reloads without exposing reviewer identity', async () => {
  jest.mocked(db.videoEvaluationSample.findFirst).mockResolvedValue({ ...sample, inspectionVersion: 1, inspection: { judgments: [{ categoryId: 'nature', visibility: 'NOT_VISIBLE' }], reviewerId: 'admin-user', reviewedAt: '2026-10-25' } } as never);
  expect(await readEvaluationEvidence('evaluation-123', 'sample-123')).toMatchObject({ inspectionVersion: 1, outcomes: [expect.objectContaining({ reason: 'SAMPLING' })] });
});
test('rejects categories outside the saved judgments and duplicate submissions', async () => {
  await expect(reviewEvaluationEvidence('evaluation-123', 'sample-123', { version: 0, judgments: [{ categoryId: 'other', visibility: 'VISIBLE' }] }, 'admin-user')).rejects.toMatchObject({ code: 'INVALID_CATEGORY' });
  await expect(reviewEvaluationEvidence('evaluation-123', 'sample-123', { version: 0, judgments: [{ categoryId: 'nature', visibility: 'VISIBLE' }, { categoryId: 'nature', visibility: 'VISIBLE' }] }, 'admin-user')).rejects.toMatchObject({ code: 'INVALID_INPUT' });
});
