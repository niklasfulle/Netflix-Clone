import { db } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
  // Movies/Series count by month, total views
  const movies = await db.movie.findMany({
    select: { id: true, type: true, createdAt: true },
  });
  const views = await db.movieView.findMany({
    select: { movieId: true, createdAt: true },
  });

  // Group by month/year
  const movieCounts: Record<string, number> = {};
  const seriesCounts: Record<string, number> = {};
  for (const m of movies) {
    const key = `${m.createdAt.getFullYear()}-${(m.createdAt.getMonth()+1).toString().padStart(2,'0')}`;
    if (m.type === 'Movie') movieCounts[key] = (movieCounts[key] || 0) + 1;
    if (m.type === 'Serie') seriesCounts[key] = (seriesCounts[key] || 0) + 1;
  }
  // Cumulative sum
  const allKeys = Array.from(new Set([...Object.keys(movieCounts), ...Object.keys(seriesCounts)])).sort();
  let movieSum = 0, seriesSum = 0;
  const timeline = allKeys.map(key => {
    movieSum += movieCounts[key] || 0;
    seriesSum += seriesCounts[key] || 0;
    return { month: key, movies: movieSum, series: seriesSum };
  });

  // Total views
  const totalViews = views.length;

  return Response.json({ timeline, totalViews });
}
