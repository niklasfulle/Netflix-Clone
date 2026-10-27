/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/db', () => ({ db: { movie: { findUnique: jest.fn() }, $transaction: jest.fn() } }));
jest.mock('@/lib/media-probe', () => ({ createFfprobe: jest.fn() }));
jest.mock('@/lib/video-stream', () => ({ resolveVideoFile: jest.fn() }));
jest.mock('node:crypto', () => ({ randomInt: jest.fn().mockReturnValue(0) }));

import { db } from '@/lib/db';
import { createFfprobe } from '@/lib/media-probe';
import { resolveVideoFile } from '@/lib/video-stream';
import { readCategorization, saveCategorization } from '../service';
import { categorizationInput } from '../validation';
import { formatCategoryTime, parseCategoryTime } from '../types';

const category = { id: 'forest', name: 'Wald', nameEn: 'Forest' };
const tx = {
  movie: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
  category: { count: jest.fn() },
  movieCategory: { deleteMany: jest.fn(), createMany: jest.fn() },
  movieCategorySegment: { deleteMany: jest.fn(), createMany: jest.fn() },
};
const input = { movieId: 'movie-1', version: 2, categoryIds: ['forest'], segments: [{ categoryId: 'city', startSeconds: 10, endSeconds: 20 }], complete: false };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(db.$transaction).mockImplementation(async callback => (callback as unknown as (transaction: typeof tx) => Promise<never>)(tx));
  jest.mocked(db.movie.findUnique).mockResolvedValue({ type: 'Movie', videoUrl: 'neutral.mp4' } as never);
  jest.mocked(resolveVideoFile).mockReturnValue('/movies/neutral.mp4');
  jest.mocked(createFfprobe).mockReturnValue(jest.fn().mockResolvedValue({ durationSeconds: 120 }) as never);
  tx.movie.count.mockResolvedValue(3);
  tx.movie.findMany.mockResolvedValue([{ id: 'movie-1' }]);
  tx.movie.findFirst.mockResolvedValue({ id: 'movie-1', title: 'Forest walk', type: 'Movie', categoryReviewVersion: 2, categoryReviewedAt: null, categories: [{ category }], categorySegments: [] });
  tx.movie.updateMany.mockResolvedValue({ count: 1 }); tx.category.count.mockResolvedValue(2);
});

it('chooses only unreviewed content without global or interval categories', async () => {
  await readCategorization({ exclude: 'other-movie' });
  expect(tx.movie.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ categories: { none: {} }, categorySegments: { none: {} }, categoryReviewedAt: null, id: { not: 'other-movie' } }), take: 1 }));
});
it('returns an empty queue without trying to choose a random index', async () => {
  tx.movie.count.mockResolvedValue(0);
  await expect(readCategorization()).resolves.toEqual({ movie: null, remaining: 0 });
  expect(tx.movie.findMany).not.toHaveBeenCalled();
});
it('reopens an already categorized video with separate whole-video and interval assignments', async () => {
  const result = await readCategorization({ movieId: 'movie-1' });
  expect(result.movie).toMatchObject({ categories: [category], segments: [], version: 2 });
  expect(tx.movie.findMany).not.toHaveBeenCalled();
});
it('saves intervals separately and checks the revision before replacing any assignments', async () => {
  await saveCategorization(input);
  expect(tx.category.count).toHaveBeenCalledWith({ where: { id: { in: ['forest', 'city'] } } });
  expect(tx.movie.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ categoryReviewVersion: 2, videoUrl: 'neutral.mp4' }), data: { categoryReviewVersion: { increment: 1 } } }));
  expect(tx.movieCategory.createMany).toHaveBeenCalledWith({ data: [{ movieId: 'movie-1', categoryId: 'forest' }], skipDuplicates: true });
  expect(tx.movieCategorySegment.createMany).toHaveBeenCalledWith({ data: [{ movieId: 'movie-1', categoryId: 'city', startSeconds: 10, endSeconds: 20 }] });
});
it('does not overwrite another editor or add unknown categories', async () => {
  tx.movie.updateMany.mockResolvedValue({ count: 0 });
  await expect(saveCategorization(input)).rejects.toMatchObject({ code: 'CONFLICT' });
  expect(tx.movieCategory.deleteMany).not.toHaveBeenCalled();
  tx.category.count.mockResolvedValue(1);
  await expect(saveCategorization(input)).rejects.toMatchObject({ code: 'INVALID_CATEGORIES' });
  expect(tx.movieCategorySegment.deleteMany).not.toHaveBeenCalled();
});
it('rejects intervals beyond the actual media duration before writing', async () => {
  await expect(saveCategorization({ ...input, segments: [{ categoryId: 'city', startSeconds: 10, endSeconds: 121 }] })).rejects.toMatchObject({ code: 'INVALID_RANGE' });
  expect(db.$transaction).not.toHaveBeenCalled();
});
it('can complete a reviewed video without choosing a category or probing a missing file', async () => {
  tx.category.count.mockResolvedValue(0);
  await saveCategorization({ ...input, categoryIds: [], segments: [], complete: true });
  expect(tx.movie.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ categoryReviewedAt: expect.any(Date) }) }));
  expect(resolveVideoFile).not.toHaveBeenCalled();
});
it.each([{ startSeconds: -1, endSeconds: 2 }, { startSeconds: 2, endSeconds: 2 }, { startSeconds: 3, endSeconds: 2 }, { startSeconds: 0, endSeconds: Infinity }])('rejects malformed ranges %j', range => {
  expect(categorizationInput.safeParse({ ...input, segments: [{ categoryId: 'city', ...range }] }).success).toBe(false);
});
it('parses frame-accurate time inputs without accepting invalid minutes', () => {
  expect(parseCategoryTime('01:02:03.125')).toBe(3723.125);
  expect(parseCategoryTime('35.5')).toBe(35.5);
  expect(parseCategoryTime('00:99:00')).toBeNull();
  expect(parseCategoryTime('')).toBeNull();
  expect(formatCategoryTime(3723.125)).toBe('01:02:03.125');
});
