import fs from "node:fs";
import path from "node:path";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type StoredLog = {
  timestamp?: string;
  level?: string;
  action?: string;
  userId?: string;
};

function readRecentLogs(): StoredLog[] {
  const logPath = path.join(process.cwd(), "logs", "backend.log");
  if (!fs.existsSync(logPath)) return [];

  try {
    return fs
      .readFileSync(logPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(-100)
      .reverse()
      .map((line) => {
        try {
          return JSON.parse(line) as StoredLog;
        } catch {
          return {};
        }
      });
  } catch {
    return [];
  }
}

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    users,
    blockedUsers,
    newUsers,
    actors,
    movies,
    series,
    newContent,
    views,
    activeProfiles,
    topViewGroups,
    recentContent,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isBlocked: true } }),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.actor.count(),
    db.movie.count({ where: { type: "Movie" } }),
    db.movie.count({ where: { type: "Serie" } }),
    db.movie.count({ where: { createdAt: { gte: since } } }),
    db.movieView.count(),
    db.profil.count({ where: { inUse: true } }),
    db.movieView.groupBy({
      by: ["movieId"],
      _count: { movieId: true },
      orderBy: { _count: { movieId: "desc" } },
      take: 5,
    }),
    db.movie.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, type: true, status: true, createdAt: true, thumbnailUrl: true },
    }),
  ]);

  const topIds = topViewGroups.map((item) => item.movieId);
  const topTitles = topIds.length
    ? await db.movie.findMany({
        where: { id: { in: topIds } },
        select: { id: true, title: true, type: true },
      })
    : [];
  const titleById = new Map(topTitles.map((item) => [item.id, item]));
  const topContent = topViewGroups.map((item) => ({
    ...titleById.get(item.movieId),
    id: item.movieId,
    views: item._count.movieId,
  }));

  const logs = readRecentLogs();
  const errors24h = logs.filter((entry) => {
    if (entry.level !== "error" || !entry.timestamp) return false;
    return Date.now() - new Date(entry.timestamp).getTime() <= 86_400_000;
  }).length;

  return Response.json({
    counts: { users, blockedUsers, newUsers, actors, movies, series, newContent, views, activeProfiles, errors24h },
    topContent,
    recentContent,
    recentActivity: logs.slice(0, 6),
  });
}
