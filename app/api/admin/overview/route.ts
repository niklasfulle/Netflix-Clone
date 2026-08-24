import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import {
  ADMIN_SUMMARY_MAX_BYTES,
  adminOverviewCacheIdentity,
  adminSummaryCache,
} from "@/lib/administration/admin-summary-runtime";
import { cacheTelemetryHeaders } from "@/lib/administration/summary-cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type StoredLog = {
  timestamp?: string;
  level?: string;
  action?: string;
  userId?: string;
};

const storedLogSchema = z.object({
  timestamp: z.string().max(64).optional(),
  level: z.string().max(16).optional(),
  action: z.string().max(160).optional(),
  userId: z.string().max(191).optional(),
}).strict();

const adminOverviewSchema = z.object({
  counts: z.object({
    users: z.number().int().nonnegative(),
    blockedUsers: z.number().int().nonnegative(),
    newUsers: z.number().int().nonnegative(),
    actors: z.number().int().nonnegative(),
    movies: z.number().int().nonnegative(),
    series: z.number().int().nonnegative(),
    newContent: z.number().int().nonnegative(),
    views: z.number().int().nonnegative(),
    activeProfiles: z.number().int().nonnegative(),
    errors24h: z.number().int().nonnegative(),
  }).strict(),
  topContent: z.array(z.object({
    id: z.string().min(1).max(191),
    title: z.string().max(512).optional(),
    type: z.string().max(64).optional(),
    views: z.number().int().nonnegative(),
  }).strict()).max(5),
  recentContent: z.array(z.object({
    id: z.string().min(1).max(191),
    title: z.string().max(512),
    type: z.string().max(64),
    status: z.string().max(64),
    createdAt: z.iso.datetime(),
    thumbnailUrl: z.string().max(4096).nullable(),
  }).strict()).max(5),
  recentActivity: z.array(storedLogSchema).max(6),
}).strict();

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

  const result = await adminSummaryCache.read({
    ...adminOverviewCacheIdentity,
    ttlSeconds: 30,
    maxValueBytes: ADMIN_SUMMARY_MAX_BYTES,
    decode: value => adminOverviewSchema.parse(value),
    async load() {
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

      return {
        counts: { users, blockedUsers, newUsers, actors, movies, series, newContent, views, activeProfiles, errors24h },
        topContent,
        recentContent: recentContent.map(item => ({ ...item, createdAt: item.createdAt.toISOString() })),
        recentActivity: logs.slice(0, 6),
      };
    },
  });

  return Response.json(result.value, { headers: cacheTelemetryHeaders(result) });
}
