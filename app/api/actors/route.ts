import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { adminMutationAudit } from "@/lib/admin-mutation-audit";
import { invalidateAdminSummaries } from "@/lib/administration/admin-summary-runtime";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function runAdminRoute(
  logContext: string,
  operation: () => Promise<Response>,
  audit?: ReturnType<typeof adminMutationAudit.begin>,
): Promise<Response> {
  try {
    if (!(await isCurrentUserAdmin())) {
      await audit?.denied();
      throw new ApiError('FORBIDDEN', 'Administrator access required.');
    }
    return await operation();
  } catch (error) {
    await audit?.failed();
    return handleApiError(error, logContext);
  }
}

function parsePage(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), max) : fallback;
}

export async function GET(request: Request = new Request("http://localhost/api/actors")) {
  return runAdminRoute('api_actors_list', async () => {
    const { searchParams } = new URL(request.url);
  const page = parsePage(searchParams.get("page"), 1, 100_000);
  const pageSize = parsePage(searchParams.get("pageSize"), 20, 100);
  const search = searchParams.get("search")?.trim() || "";
  const orphaned = searchParams.get("orphaned") === "true";
  const sort = searchParams.get("sort") || "name";
  const direction = searchParams.get("direction") === "desc" ? "desc" : "asc";

  const [actors, viewGroups] = await Promise.all([
    db.actor.findMany({
      where: {
        ...(search && { name: { contains: search, mode: "insensitive" } }),
        ...(orphaned && { movies: { none: {} } }),
      },
      include: {
        movies: {
          include: {
            movie: { select: { id: true, title: true, type: true, status: true, thumbnailUrl: true } },
          },
        },
      },
    }),
    db.movieView.groupBy({ by: ["movieId"], _count: { movieId: true } }),
  ]);

  const viewsByMovie = new Map(viewGroups.map((item) => [item.movieId, item._count.movieId]));
  const result = actors.map((actor) => {
    const content = actor.movies.map((entry) => entry.movie);
    return {
      id: actor.id,
      name: actor.name,
      createdAt: actor.createdAt,
      movieCount: content.filter((item) => item.type === "Movie").length,
      seriesCount: content.filter((item) => item.type === "Serie").length,
      views: content.reduce((sum, item) => sum + (viewsByMovie.get(item.id) || 0), 0),
      content,
    };
  });

  const sorted = [...result];
  sorted.sort((left, right) => {
    const a = sort === "name" ? left.name.toLocaleLowerCase("de") : Number(left[sort as "views" | "movieCount" | "seriesCount"] || 0);
    const b = sort === "name" ? right.name.toLocaleLowerCase("de") : Number(right[sort as "views" | "movieCount" | "seriesCount"] || 0);
    const comparison = typeof a === "string" && typeof b === "string" ? a.localeCompare(b, "de") : Number(a) - Number(b);
    return direction === "asc" ? comparison : -comparison;
  });
  const total = sorted.length;

    return Response.json({
      actors: sorted.slice((page - 1) * pageSize, page * pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  });
}

export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('actor.create');
  return runAdminRoute('api_actors_create', async () => {
    const rawName = (await request.json()).name;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name) throw new ApiError('VALIDATION_ERROR', 'Actor name is required.');

    const exists = await db.actor.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
    if (exists) throw new ApiError('CONFLICT', 'This actor already exists.');

    const actor = await db.actor.create({ data: { name } });
    logBackendAction("actor_created", { actorId: actor.id }, "info");
    await audit.succeeded({ target: { type: 'actor', id: actor.id } });
    await invalidateAdminSummaries();
    return Response.json(actor, { status: 201 });
  }, audit);
}

export async function PATCH(request: Request) {
  const audit = adminMutationAudit.begin('actor.update');
  return runAdminRoute('api_actors_update', async () => {
    const { id, name: rawName } = await request.json();
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!id || !name) throw new ApiError('VALIDATION_ERROR', 'Actor ID and name are required.');

    const duplicate = await db.actor.findFirst({
      where: { id: { not: id }, name: { equals: name, mode: "insensitive" } },
    });
    if (duplicate) throw new ApiError('CONFLICT', 'Another actor already uses this name.');

    const actor = await db.actor.update({ where: { id }, data: { name } });
    logBackendAction("actor_renamed", { actorId: id }, "info");
    await audit.succeeded({
      target: { type: 'actor', id },
      metadata: { changedFields: ['name'] },
    });
    await invalidateAdminSummaries();
    return Response.json(actor);
  }, audit);
}

export async function DELETE(request: Request) {
  const audit = adminMutationAudit.begin('actor.delete');
  return runAdminRoute('api_actors_delete', async () => {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError('VALIDATION_ERROR', 'Actor ID is required.');

    const actor = await db.actor.findUnique({ where: { id }, include: { movies: true } });
    if (!actor) throw new ApiError('NOT_FOUND', 'Actor not found.');
    if (actor.movies.length > 0) {
      throw new ApiError('CONFLICT', 'Linked actors must be merged or unlinked before deletion.');
    }
    await db.actor.delete({ where: { id } });
    logBackendAction("actor_deleted", { actorId: id }, "info");
    await audit.succeeded({
      target: { type: 'actor', id },
      metadata: { associatedContentCount: actor.movies.length },
    });
    await invalidateAdminSummaries();
    return Response.json({ success: true });
  }, audit);
}
