import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { sourceId, targetId } = await request.json();
  if (!sourceId || !targetId || sourceId === targetId) {
    return Response.json({ error: "Quelle und Ziel müssen verschieden sein." }, { status: 400 });
  }

  const [source, target] = await Promise.all([
    db.actor.findUnique({ where: { id: sourceId }, include: { movies: true } }),
    db.actor.findUnique({ where: { id: targetId } }),
  ]);
  if (!source || !target) return Response.json({ error: "Darsteller wurde nicht gefunden." }, { status: 404 });

  await db.$transaction(async (transaction) => {
    if (source.movies.length > 0) {
      await transaction.movieActor.createMany({
        data: source.movies.map((entry) => ({ movieId: entry.movieId, actorId: targetId })),
        skipDuplicates: true,
      });
      await transaction.movieActor.deleteMany({ where: { actorId: sourceId } });
    }
    await transaction.actor.delete({ where: { id: sourceId } });
  });

  logBackendAction("actors_merged", { sourceId, targetId }, "info");
  return Response.json({ success: true });
}
