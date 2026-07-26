import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";

export const dynamic = "force-dynamic";

function parsePage(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), max) : fallback;
}

export async function GET(request: Request = new Request("http://localhost/api/actors")) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

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
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const rawName = (await request.json()).name;
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) return Response.json({ error: "Name ist erforderlich." }, { status: 400 });

  const exists = await db.actor.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (exists) return Response.json({ error: "Dieser Darsteller existiert bereits." }, { status: 409 });

  const actor = await db.actor.create({ data: { name } });
  logBackendAction("actor_created", { actorId: actor.id }, "info");
  return Response.json(actor, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id, name: rawName } = await request.json();
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!id || !name) return Response.json({ error: "ID und Name sind erforderlich." }, { status: 400 });

  const duplicate = await db.actor.findFirst({
    where: { id: { not: id }, name: { equals: name, mode: "insensitive" } },
  });
  if (duplicate) return Response.json({ error: "Ein anderer Darsteller verwendet diesen Namen bereits." }, { status: 409 });

  const actor = await db.actor.update({ where: { id }, data: { name } });
  logBackendAction("actor_renamed", { actorId: id }, "info");
  return Response.json(actor);
}

export async function DELETE(request: Request) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "ID ist erforderlich." }, { status: 400 });

  const actor = await db.actor.findUnique({ where: { id }, include: { movies: true } });
  if (!actor) return Response.json({ error: "Darsteller wurde nicht gefunden." }, { status: 404 });
  if (actor.movies.length > 0) {
    return Response.json({ error: "Verknüpfte Darsteller können nicht gelöscht werden. Führe sie zuerst zusammen oder entferne die Zuordnungen." }, { status: 409 });
  }
  await db.actor.delete({ where: { id } });
  logBackendAction("actor_deleted", { actorId: id }, "info");
  return Response.json({ success: true });
}
