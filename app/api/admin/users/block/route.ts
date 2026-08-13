import { currentUser } from "@/lib/auth";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";
import { currentSecurityContext, sessionSecurity } from "@/lib/session-security";

async function getAdminBlockError(block: boolean, role: string) {
  if (!block || role !== "ADMIN") return null;

  const activeAdmins = await db.user.count({
    where: { role: "ADMIN", isBlocked: false },
  });
  return activeAdmins <= 1
    ? "Der letzte aktive Administrator kann nicht gesperrt werden."
    : null;
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const admin = await currentUser();
  const { userId, block, reason, blockedUntil } = await request.json();
  if (!userId || typeof block !== "boolean") {
    return Response.json({ error: "Benutzer-ID und Sperrstatus sind erforderlich." }, { status: 400 });
  }
  if (admin?.id === userId) return Response.json({ error: "Du kannst dein eigenes Konto nicht sperren." }, { status: 409 });

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return Response.json({ error: "Benutzer wurde nicht gefunden." }, { status: 404 });
  const adminBlockError = await getAdminBlockError(block, target.role);
  if (adminBlockError) {
    return Response.json({ error: adminBlockError }, { status: 409 });
  }

  const until = block && blockedUntil ? new Date(blockedUntil) : null;
  if (until && Number.isNaN(until.getTime())) return Response.json({ error: "Ungültiges Ablaufdatum." }, { status: 400 });

  const user = await db.user.update({
    where: { id: userId },
    data: {
      isBlocked: block,
      blockedAt: block ? new Date() : null,
      blockedUntil: block ? until : null,
      blockedReason: block ? String(reason || "").trim() || null : null,
    },
    select: { id: true, isBlocked: true, blockedAt: true, blockedUntil: true, blockedReason: true },
  });
  await sessionSecurity.revokeAllSessions({
    userId,
    event: block ? "account_blocked" : "account_unblocked",
    context: await currentSecurityContext(),
  });
  logBackendAction(block ? "admin_user_blocked" : "admin_user_unblocked", { userId }, "info");
  return Response.json({ success: true, user });
}
