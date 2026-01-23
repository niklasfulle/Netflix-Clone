import { db } from '@/lib/db';

export const dynamic = "force-dynamic";


function compareLocale(a: string, b: string) {
  return a.localeCompare(b);
}

export async function GET() {
  // Movies/Series count by month, total views
  const movies = await db.movie.findMany({
    select: { id: true, type: true, createdAt: true },
  });
  const views = await db.movieView.findMany({
    select: { movieId: true, createdAt: true },
  });

  // Group by day for timeline
  const movieCountsDay: Record<string, number> = {};
  const seriesCountsDay: Record<string, number> = {};
  // Group by month for monthly
  const movieCountsMonth: Record<string, number> = {};
  const seriesCountsMonth: Record<string, number> = {};
  for (const m of movies) {
    const dayKey = `${m.createdAt.getFullYear()}-${(m.createdAt.getMonth()+1).toString().padStart(2,'0')}-${m.createdAt.getDate().toString().padStart(2,'0')}`;
    const monthKey = `${m.createdAt.getFullYear()}-${(m.createdAt.getMonth()+1).toString().padStart(2,'0')}`;
    if (m.type === 'Movie') {
      movieCountsDay[dayKey] = (movieCountsDay[dayKey] || 0) + 1;
      movieCountsMonth[monthKey] = (movieCountsMonth[monthKey] || 0) + 1;
    }
    if (m.type === 'Serie') {
      seriesCountsDay[dayKey] = (seriesCountsDay[dayKey] || 0) + 1;
      seriesCountsMonth[monthKey] = (seriesCountsMonth[monthKey] || 0) + 1;
    }
  }
  // Timeline: cumulative sum per day
  const allDayKeys = Array.from(new Set([...Object.keys(movieCountsDay), ...Object.keys(seriesCountsDay)])).sort((a, b) => a.localeCompare(b));
  let movieSum = 0, seriesSum = 0;
  const timeline = allDayKeys.map(key => {
    movieSum += movieCountsDay[key] || 0;
    seriesSum += seriesCountsDay[key] || 0;
    return { day: key, movies: movieSum, series: seriesSum };
  });

  // Monthly (nicht kumuliert)
  // Reliable alphabetical sort using localeCompare
  const allMonthKeys = Array.from(new Set([...Object.keys(movieCountsMonth), ...Object.keys(seriesCountsMonth)])).sort(compareLocale);
  const monthly = allMonthKeys.map(key => ({
    month: key,
    movies: movieCountsMonth[key] || 0,
    series: seriesCountsMonth[key] || 0,
  }));

  // Total views
  const totalViews = views.length;

  return Response.json({ timeline, totalViews, monthly });
}
