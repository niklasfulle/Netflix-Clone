import type { ContentStatus, Prisma } from "@prisma/client";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";

export const dynamic = "force-dynamic";

const allowedSortKeys = new Set(["title", "type", "genre", "createdAt", "updatedAt", "status"]);

function boundedNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

export async function GET(request: Request = new Request("http://localhost/api/movies/admin")) {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = boundedNumber(searchParams.get("page"), 1, 1, 100_000);
    const pageSize = boundedNumber(searchParams.get("pageSize"), 20, 10, 100);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const genre = searchParams.get("genre") || "all";
    const actor = searchParams.get("actor")?.trim() || "";
    const requestedSort = searchParams.get("sort") || "createdAt";
    const sort = allowedSortKeys.has(requestedSort) ? requestedSort : "createdAt";
    const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";

    const where: Prisma.MovieWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(type !== "all" && { type }),
      ...(status !== "all" && { status: status as ContentStatus }),
      ...(genre !== "all" && { genre }),
      ...(actor && {
        actors: { some: { actor: { name: { contains: actor, mode: "insensitive" } } } },
      }),
    };

    const [total, movies, views, genres] = await Promise.all([
      db.movie.count({ where }),
      db.movie.findMany({
        where,
        orderBy: { [sort]: direction },
        include: { actors: { include: { actor: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.movieView.groupBy({ by: ["movieId"], _count: { movieId: true } }),
      db.movie.findMany({ distinct: ["genre"], select: { genre: true }, orderBy: { genre: "asc" } }),
    ]);

    const viewMap = new Map(views.map((view) => [view.movieId, view._count.movieId]));
    return Response.json({
      movies: movies.map((movie) => ({ ...movie, views: viewMap.get(movie.id) || 0 })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      filters: { genres: genres.map((item) => item.genre).filter(Boolean) },
    });
  } catch (error) {
    logBackendAction("api_movies_admin_error", { error: String(error) }, "error");
    return Response.json({ error: "Inhalte konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ids, status } = await request.json();
  const allowedStatuses: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
  if (!Array.isArray(ids) || ids.length === 0 || !allowedStatuses.includes(status)) {
    return Response.json({ error: "Ungültige Auswahl oder Status." }, { status: 400 });
  }

  const result = await db.movie.updateMany({
    where: { id: { in: ids } },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
  logBackendAction("api_movies_admin_bulk_status", { count: result.count, status }, "info");
  return Response.json({ success: true, count: result.count });
}
