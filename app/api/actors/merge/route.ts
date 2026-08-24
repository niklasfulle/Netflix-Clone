import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { adminMutationAudit } from "@/lib/admin-mutation-audit";
import { invalidateAdminSummaries } from "@/lib/administration/admin-summary-runtime";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";

export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('actor.merge');
  if (!(await isCurrentUserAdmin())) {
    await audit.denied();
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { sourceId, targetId } = await request.json();
    if (!sourceId || !targetId || sourceId === targetId) {
      await audit.failed();
      return Response.json({ error: "Quelle und Ziel müssen verschieden sein." }, { status: 400 });
    }

    const [source, target] = await Promise.all([
      db.actor.findUnique({ where: { id: sourceId }, include: { movies: true } }),
      db.actor.findUnique({ where: { id: targetId } }),
    ]);
    if (!source || !target) {
      await audit.failed();
      return Response.json({ error: "Darsteller wurde nicht gefunden." }, { status: 404 });
    }

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
    await audit.succeeded({
      target: { type: 'actor', id: targetId },
      metadata: { mergedCount: source.movies.length },
    });
    await invalidateAdminSummaries();
    return Response.json({ success: true });
  } catch (error) {
    await audit.failed();
    throw error;
  }
}
