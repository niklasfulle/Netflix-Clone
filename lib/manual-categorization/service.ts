import 'server-only';
import { randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { createFfprobe } from '@/lib/media-probe';
import { resolveVideoFile } from '@/lib/video-stream';
import type { CategorizationResponse } from './types';
import { categorizationInput, type CategorizationInput } from './validation';

export class CategorizationError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'CONFLICT' | 'INVALID_CATEGORIES' | 'VIDEO_UNAVAILABLE' | 'INVALID_RANGE') { super(code); }
}
const eligible: Prisma.MovieWhereInput = {
  status: { in: ['PUBLISHED', 'DRAFT'] }, type: { in: ['Movie', 'Serie'] },
  categories: { none: {} }, categorySegments: { none: {} }, categoryReviewedAt: null,
};

export async function readCategorization(query: { movieId?: string; exclude?: string } = {}): Promise<CategorizationResponse> {
  return db.$transaction(async transaction => {
    const remaining = await transaction.movie.count({ where: eligible });
    let id = query.movieId;
    if (!id && remaining) {
      const where = query.exclude ? { ...eligible, id: { not: query.exclude } } : eligible;
      const count = query.exclude ? await transaction.movie.count({ where }) : remaining;
      const candidates = await transaction.movie.findMany({ where: count ? where : eligible, select: { id: true }, orderBy: { id: 'asc' }, skip: randomInt(count || remaining), take: 1 });
      id = candidates[0]?.id;
    }
    if (!id) return { movie: null, remaining };
    const movie = await transaction.movie.findFirst({
      where: { id, status: { not: 'ARCHIVED' } },
      select: { id: true, title: true, type: true, categoryReviewVersion: true, categoryReviewedAt: true,
        categories: { select: { category: { select: { id: true, name: true, nameEn: true } } } },
        categorySegments: { orderBy: { startSeconds: 'asc' }, select: { categoryId: true, startSeconds: true, endSeconds: true, category: { select: { id: true, name: true, nameEn: true } } } },
      },
    });
    if (!movie) throw new CategorizationError('NOT_FOUND');
    return { remaining, movie: { id: movie.id, title: movie.title, type: movie.type,
      version: movie.categoryReviewVersion, completed: Boolean(movie.categoryReviewedAt),
      categories: movie.categories.map(link => link.category), segments: movie.categorySegments } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

export async function saveCategorization(value: CategorizationInput) {
  const input = categorizationInput.parse(value);
  const source = await db.movie.findUnique({ where: { id: input.movieId }, select: { videoUrl: true, type: true } });
  if (!source) throw new CategorizationError('NOT_FOUND');
  if (input.segments.length) {
    const base = source.type === 'Serie' ? process.env.SERIES_FOLDER || './series' : process.env.MOVIE_FOLDER || './movies';
    const path = resolveVideoFile(base, source.videoUrl);
    if (!path) throw new CategorizationError('VIDEO_UNAVAILABLE');
    let duration: number | null;
    try { duration = (await createFfprobe()(path)).durationSeconds; }
    catch { throw new CategorizationError('VIDEO_UNAVAILABLE'); }
    if (duration === null || input.segments.some(segment => segment.endSeconds > duration)) throw new CategorizationError('INVALID_RANGE');
  }
  try {
    await db.$transaction(async transaction => {
      const ids = [...new Set([...input.categoryIds, ...input.segments.map(segment => segment.categoryId)])];
      if (ids.length !== await transaction.category.count({ where: { id: { in: ids } } })) throw new CategorizationError('INVALID_CATEGORIES');
      const updated = await transaction.movie.updateMany({ where: { id: input.movieId, categoryReviewVersion: input.version, videoUrl: source.videoUrl, status: { not: 'ARCHIVED' } },
        data: { categoryReviewVersion: { increment: 1 }, ...(input.complete ? { categoryReviewedAt: new Date() } : {}) } });
      if (!updated.count) throw new CategorizationError('CONFLICT');
      await transaction.movieCategory.deleteMany({ where: { movieId: input.movieId, categoryId: { notIn: input.categoryIds } } });
      if (input.categoryIds.length) await transaction.movieCategory.createMany({ data: input.categoryIds.map(categoryId => ({ movieId: input.movieId, categoryId })), skipDuplicates: true });
      await transaction.movieCategorySegment.deleteMany({ where: { movieId: input.movieId } });
      if (input.segments.length) await transaction.movieCategorySegment.createMany({ data: input.segments.map(segment => ({ ...segment, movieId: input.movieId })) });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new CategorizationError('CONFLICT');
    throw error;
  }
  return readCategorization({ movieId: input.movieId });
}
