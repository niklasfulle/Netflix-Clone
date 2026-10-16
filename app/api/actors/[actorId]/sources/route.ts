import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { adminMutationAudit } from "@/lib/admin-mutation-audit";
import { ApiError, handleApiError } from "@/lib/api-helpers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ actorId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const audit = adminMutationAudit.begin("actor.source.create");
  try {
    if (!(await isCurrentUserAdmin())) {
      await audit.denied();
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { actorId } = await context.params;
    const body = await request.json();
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    if (!label || label.length > 80 || !rawUrl || rawUrl.length > 2048) {
      throw new ApiError("VALIDATION_ERROR", "Eine Bezeichnung und eine gültige URL sind erforderlich.");
    }

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Bitte gib eine gültige URL ein.");
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new ApiError("VALIDATION_ERROR", "Die Quelle muss eine HTTP- oder HTTPS-URL ohne Zugangsdaten sein.");
    }

    if (!(await db.actor.findUnique({ where: { id: actorId }, select: { id: true } }))) {
      throw new ApiError("NOT_FOUND", "Darsteller wurde nicht gefunden.");
    }

    if (await db.actorSource.findFirst({ where: { actorId, url: url.toString() }, select: { id: true } })) {
      throw new ApiError("CONFLICT", "Diese Quelle ist für den Darsteller bereits hinterlegt.");
    }

    const source = await db.actorSource.create({ data: { actorId, label, url: url.toString() } });
    await audit.succeeded({ target: { type: "actor_source", id: source.id } });
    return Response.json({ source }, { status: 201 });
  } catch (error) {
    await audit.failed();
    return handleApiError(error, "api_actor_source_create");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const audit = adminMutationAudit.begin("actor.source.delete");
  try {
    if (!(await isCurrentUserAdmin())) {
      await audit.denied();
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { actorId } = await context.params;
    const sourceId = new URL(request.url).searchParams.get("sourceId");
    if (!sourceId) throw new ApiError("VALIDATION_ERROR", "Quellen-ID ist erforderlich.");

    const source = await db.actorSource.findFirst({ where: { id: sourceId, actorId }, select: { id: true } });
    if (!source) throw new ApiError("NOT_FOUND", "Quelle wurde nicht gefunden.");

    await db.actorSource.delete({ where: { id: source.id } });
    await audit.succeeded({ target: { type: "actor_source", id: source.id } });
    return Response.json({ success: true });
  } catch (error) {
    await audit.failed();
    return handleApiError(error, "api_actor_source_delete");
  }
}
