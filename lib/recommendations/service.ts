import 'server-only';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { catalogThumbnailUrl } from '@/lib/catalog';
import { rankRecommendations } from './ranking';
import type { VideoRecommendation } from './types';

const movieSelect = {
  id: true, title: true, createdAt: true,
  actors: { select: { actorId: true } },
  categories: { select: { categoryId: true } },
  categorySegments: { distinct: ['categoryId'], select: { categoryId: true } },
} satisfies Prisma.MovieSelect;
type MovieFeatures = Prisma.MovieGetPayload<{ select: typeof movieSelect }>;
function features(movie: MovieFeatures) {
  return { id: movie.id, title: movie.title, createdAt: movie.createdAt.getTime(),
    actorIds: movie.actors.map(link => link.actorId),
    categoryIds: [...new Set([...movie.categories, ...movie.categorySegments].map(link => link.categoryId))] };
}

export async function videoRecommendations(movieId: string): Promise<VideoRecommendation[] | null> {
  const source = await db.movie.findFirst({ where: { id: movieId, status: 'PUBLISHED' }, select: movieSelect });
  if (!source) return null;
  const current = features(source);
  const published: Prisma.MovieWhereInput = { id: { not: movieId }, status: 'PUBLISHED', type: { in: ['Movie', 'Serie'] } };
  const [actorGroups, categoryMatches, fallback] = await Promise.all([
    current.actorIds.length ? db.actor.findMany({
      where: { id: { in: current.actorIds } },
      select: { movies: { where: { movie: published }, orderBy: { movie: { createdAt: 'desc' } }, take: 40, select: { movie: { select: movieSelect } } } },
    }) : [],
    current.categoryIds.length ? db.movie.findMany({ where: { ...published, OR: [
      { categories: { some: { categoryId: { in: current.categoryIds } } } },
      { categorySegments: { some: { categoryId: { in: current.categoryIds } } } },
    ] }, select: movieSelect, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 600 }) : [],
    db.movie.findMany({ where: published, select: movieSelect, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 6 }),
  ]);
  const candidates = [...actorGroups.flatMap(actor => actor.movies.map(link => link.movie)), ...categoryMatches, ...fallback].map(features);
  return rankRecommendations(current, candidates).map(({ item, reason }) => ({ id: item.id, title: item.title, thumbnailUrl: catalogThumbnailUrl(item.id), reason }));
}
