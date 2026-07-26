import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function parseDuration(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export async function GET(request: Request = new Request("http://localhost/api/statistics/admin-overview")) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const requestedDays = Number.parseInt(new URL(request.url).searchParams.get("days") || "30", 10);
  const days = [7, 30, 90, 365].includes(requestedDays) ? requestedDays : 30;
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  const previousFrom = new Date(from);
  previousFrom.setDate(previousFrom.getDate() - days);

  const [movies, periodViews, previousViews, totalViews, users, profiles, watchTimes] = await Promise.all([
    db.movie.findMany({ select: { id: true, title: true, type: true, genre: true, duration: true, createdAt: true } }),
    db.movieView.findMany({ where: { createdAt: { gte: from } }, select: { movieId: true, userId: true, createdAt: true } }),
    db.movieView.count({ where: { createdAt: { gte: previousFrom, lt: from } } }),
    db.movieView.count(),
    db.user.count(),
    db.profil.count(),
    db.movieWatchTime.findMany({ select: { movieId: true, time: true } }),
  ]);

  const movieById = new Map(movies.map((movie) => [movie.id, movie]));
  const viewsByDay = new Map<string, number>();
  const viewsByMovie = new Map<string, number>();
  const viewsByGenre = new Map<string, number>();
  for (const view of periodViews) {
    const key = dayKey(view.createdAt);
    viewsByDay.set(key, (viewsByDay.get(key) || 0) + 1);
    viewsByMovie.set(view.movieId, (viewsByMovie.get(view.movieId) || 0) + 1);
    const genre = movieById.get(view.movieId)?.genre || "Unbekannt";
    viewsByGenre.set(genre, (viewsByGenre.get(genre) || 0) + 1);
  }

  const viewsTimeline = Array.from({ length: days }, (_, index) => {
    const date = new Date(from);
    date.setDate(date.getDate() + index);
    const day = dayKey(date);
    return { day, views: viewsByDay.get(day) || 0 };
  });

  const topContent = [...viewsByMovie.entries()]
    .map(([id, views]) => ({ id, views, ...movieById.get(id) }))
    .sort((left, right) => right.views - left.views)
    .slice(0, 10);
  const genreDistribution = [...viewsByGenre.entries()]
    .map(([genre, views]) => ({ genre, views }))
    .sort((left, right) => right.views - left.views);

  const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const monthlyMap = new Map<string, { movies: number; series: number }>();
  for (const movie of movies.filter((item) => item.createdAt >= startMonth)) {
    const key = monthKey(movie.createdAt);
    const current = monthlyMap.get(key) || { movies: 0, series: 0 };
    if (movie.type === "Serie") current.series += 1;
    else current.movies += 1;
    monthlyMap.set(key, current);
  }
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
    const month = monthKey(date);
    return { month, ...(monthlyMap.get(month) || { movies: 0, series: 0 }) };
  });

  let progressTotal = 0;
  let progressCount = 0;
  for (const watchTime of watchTimes) {
    const duration = parseDuration(movieById.get(watchTime.movieId)?.duration || "");
    if (duration > 0) {
      progressTotal += Math.min((watchTime.time / duration) * 100, 100);
      progressCount += 1;
    }
  }

  const periodTotal = periodViews.length;
  let changePercent = 0;
  if (previousViews === 0) {
    changePercent = periodTotal > 0 ? 100 : 0;
  } else {
    changePercent = Math.round(
      ((periodTotal - previousViews) / previousViews) * 100,
    );
  }

  return Response.json({
    days,
    totalViews,
    periodViews: periodTotal,
    previousPeriodViews: previousViews,
    changePercent,
    activeUsers: new Set(periodViews.map((view) => view.userId)).size,
    users,
    profiles,
    movies: movies.filter((movie) => movie.type === "Movie").length,
    series: movies.filter((movie) => movie.type === "Serie").length,
    averageProgress: progressCount ? Math.round(progressTotal / progressCount) : 0,
    viewsTimeline,
    monthly,
    topContent,
    genreDistribution,
  });
}
