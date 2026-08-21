import type { ContentStatus, Prisma } from "@prisma/client";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { adminMutationAudit } from "@/lib/admin-mutation-audit";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";

export const dynamic = "force-dynamic";

const allowedSortKeys = new Set(["title", "type", "genre", "createdAt", "updatedAt", "status"]);
const AUDIT_ACTION_BY_STATUS = {
  DRAFT: 'content.update',
  PUBLISHED: 'content.publish',
  ARCHIVED: 'content.archive',
} as const satisfies Record<ContentStatus, 'content.update' | 'content.publish' | 'content.archive'>;

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
  const authorizationAudit = adminMutationAudit.begin('content.update');
  if (!(await isCurrentUserAdmin())) {
    await authorizationAudit.denied();
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ids, status } = await request.json();
  const allowedStatuses: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
  if (!Array.isArray(ids) || ids.length === 0 || !allowedStatuses.includes(status)) {
    await authorizationAudit.failed();
    return Response.json({ error: "Ungültige Auswahl oder Status." }, { status: 400 });
  }

  const action = AUDIT_ACTION_BY_STATUS[status as ContentStatus];
  let audits: Array<{
    previousStatus: ContentStatus;
    operation: ReturnType<typeof adminMutationAudit.begin>;
    targetId: string;
  }> = [];

  try {
    const targets = await db.movie.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    });
    audits = targets.map((target) => ({
      previousStatus: target.status,
      operation: adminMutationAudit.begin(action),
      targetId: target.id,
    }));

    const result = await db.movie.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
    await Promise.all(audits.map(({ operation, previousStatus, targetId }) => (
      operation.succeeded({
        target: { type: 'content', id: targetId },
        metadata: action === 'content.update'
          ? { changedFields: ['status'], previousStatus, nextStatus: status }
          : { previousStatus },
      })
    )));
    logBackendAction("api_movies_admin_bulk_status", { count: result.count, status }, "info");
    return Response.json({ success: true, count: result.count });
  } catch (error) {
    if (audits.length === 0) {
      await authorizationAudit.failed();
    } else {
      await Promise.all(audits.map(({ operation, targetId }) => (
        operation.failed({ target: { type: 'content', id: targetId } })
      )));
    }
    throw error;
  }
}
