/** @jest-environment node */
jest.mock('@/lib/db', () => ({ db: { movie: { findUnique: jest.fn() }, videoExample: { findMany: jest.fn(), deleteMany: jest.fn() }, $transaction: jest.fn() } }));
jest.mock('@/lib/media-probe', () => ({ createFfprobe: jest.fn() }));
jest.mock('@/lib/video-analysis/source', () => ({ inspectAnalysisSource: jest.fn() }));
import { db } from '@/lib/db';
import { createFfprobe } from '@/lib/media-probe';
import { inspectAnalysisSource } from '@/lib/video-analysis/source';
import { readVideoExamples, saveVideoExample, removeVideoExample } from '../service';
import { createVideoExample } from '../validation';
import { parseExampleTime, formatExampleTime } from '../types';

const fingerprint = 'a'.repeat(64);
const input = { movieId: 'movie', requestId: 'a13b7f78-43cd-4a5e-a8de-6725ecf83703', sourceFingerprint: fingerprint, startSeconds: 5, endSeconds: 10, labels: [{ categoryId: 'category', verdict: 'PRESENT' as const }], note: '' };
const snapshot = { categoryId: 'category', name: 'Natur', nameEn: 'Nature', verdict: 'PRESENT' };
const transaction = { $queryRaw: jest.fn(), movie: { findUnique: jest.fn() }, category: { findMany: jest.fn() }, videoExample: { findUnique: jest.fn(), count: jest.fn(), create: jest.fn(), updateMany: jest.fn() } };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(db.movie.findUnique).mockResolvedValue({ id: 'movie', title: 'Test video', type: 'Movie', videoUrl: 'fixture.mp4' } as never);
  jest.mocked(inspectAnalysisSource).mockResolvedValue({ fingerprint, filePath: '/movies/fixture.mp4' });
  jest.mocked(createFfprobe).mockReturnValue(jest.fn().mockResolvedValue({ durationSeconds: 60, streams: [{ type: 'video' }] }));
  (db.$transaction as jest.Mock).mockImplementation(callback => callback(transaction));
  transaction.movie.findUnique.mockResolvedValue({ id: 'movie', type: 'Movie', videoUrl: 'fixture.mp4' });
  transaction.category.findMany.mockResolvedValue([{ id: 'category', name: 'Natur', nameEn: 'Nature' }]);
  transaction.videoExample.findUnique.mockResolvedValue(null);
  transaction.videoExample.count.mockResolvedValue(0);
  transaction.videoExample.create.mockResolvedValue({ id: 'example', version: 1 });
});
test('stores server-owned bilingual category snapshots and the authenticated reviewer', async () => {
  expect(await saveVideoExample(input, 'admin')).toEqual({ id: 'example', version: 1 });
  expect(transaction.videoExample.create).toHaveBeenCalledWith({ data: expect.objectContaining({ movieId: 'movie', reviewerId: 'admin', labels: [snapshot], startSeconds: 5, endSeconds: 10, sourceFingerprint: fingerprint }) });
});
test('rejects ranges outside the probed duration and stale source fingerprints before writing', async () => {
  await expect(saveVideoExample({ ...input, endSeconds: 61 }, 'admin')).rejects.toHaveProperty('code', 'INVALID_TIME_RANGE');
  await expect(saveVideoExample({ ...input, sourceFingerprint: 'b'.repeat(64) }, 'admin')).rejects.toHaveProperty('code', 'VIDEO_CHANGED');
  expect(db.$transaction).not.toHaveBeenCalled();
});
test('refuses unknown categories and bounded-example overflow', async () => {
  transaction.category.findMany.mockResolvedValueOnce([]);
  await expect(saveVideoExample(input, 'admin')).rejects.toHaveProperty('code', 'INVALID_CATEGORY');
  transaction.videoExample.count.mockResolvedValue(500);
  await expect(saveVideoExample(input, 'admin')).rejects.toHaveProperty('code', 'EXAMPLE_LIMIT');
  expect(transaction.videoExample.create).not.toHaveBeenCalled();
});
test('deduplicates retries even when PostgreSQL returns JSON object keys in a different order', async () => {
  transaction.videoExample.findUnique.mockResolvedValue({ id: 'existing', version: 1, ...input, labels: [{ verdict: 'PRESENT', nameEn: 'Nature', name: 'Natur', categoryId: 'category' }] });
  expect(await saveVideoExample(input, 'admin')).toEqual({ id: 'existing', version: 1 });
  expect(transaction.videoExample.create).not.toHaveBeenCalled();
  await expect(saveVideoExample({ ...input, endSeconds: 12 }, 'admin')).rejects.toHaveProperty('code', 'EXAMPLE_CONFLICT');
});
test('uses optimistic versions and preserves snapshots when a category was deleted', async () => {
  transaction.videoExample.findUnique.mockResolvedValue({ id: 'example', movieId: 'movie', version: 2, sourceFingerprint: fingerprint, labels: [snapshot] });
  const update = { ...input, id: 'example', version: 1 };
  await expect(saveVideoExample(update, 'admin')).rejects.toHaveProperty('code', 'EXAMPLE_CONFLICT');
  transaction.category.findMany.mockResolvedValue([]);
  transaction.videoExample.updateMany.mockResolvedValue({ count: 1 });
  expect(await saveVideoExample({ ...update, version: 2 }, 'admin')).toEqual({ id: 'example', version: 3 });
  expect(transaction.videoExample.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ labels: [snapshot], version: { increment: 1 } }) }));
});
test('marks outdated examples as stale and omits reviewer metadata', async () => {
  jest.mocked(db.videoExample.findMany).mockResolvedValue([{ id: 'example', startSeconds: 1, endSeconds: 3, sourceFingerprint: 'old', labels: [snapshot], note: '', version: 1, reviewerId: 'admin' }] as never);
  const result = await readVideoExamples('movie');
  expect(result.examples[0]).toMatchObject({ stale: true });
  expect(result.examples[0]).not.toHaveProperty('reviewerId');
});
test('deletes only the requested example version', async () => {
  jest.mocked(db.videoExample.deleteMany).mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
  await expect(removeVideoExample('example', 1)).rejects.toHaveProperty('code', 'EXAMPLE_CONFLICT');
  await removeVideoExample('example', 2);
  expect(db.videoExample.deleteMany).toHaveBeenLastCalledWith({ where: { id: 'example', version: 2 } });
});
test('validates time notation, explicit verdicts and unique category IDs', () => {
  expect(parseExampleTime('01:02:03,250')).toBe(3723.25);
  expect(formatExampleTime(3723.25)).toBe('01:02:03.250');
  expect(parseExampleTime('00:60:00')).toBeNaN();
  expect(parseExampleTime('-1')).toBeNaN();
  expect(createVideoExample.safeParse({ ...input, labels: [...input.labels, ...input.labels] }).success).toBe(false);
  expect(createVideoExample.safeParse({ ...input, endSeconds: 5 }).success).toBe(false);
  expect(createVideoExample.safeParse({ ...input, labels: [] }).success).toBe(false);
  expect(createVideoExample.safeParse({ ...input, labels: [{ categoryId: 'category', verdict: 'UNCERTAIN' }] }).success).toBe(true);
});
