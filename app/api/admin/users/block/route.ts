import { currentUser } from "@/lib/auth";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { adminMutationAudit } from "@/lib/admin-mutation-audit";
import { invalidateAdminSummaries } from "@/lib/administration/admin-summary-runtime";
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

type UserBlockCommand = {
  userId: string;
  block: boolean;
  reason: string;
  blockedUntil: string | null;
};

type UserBlockValidation =
  | { ok: true; until: Date | null }
  | { ok: false; outcome: 'DENIED' | 'FAILED'; message: string; status: number };

function parseUserBlockCommand(body: unknown): UserBlockCommand | null {
  if (!body || typeof body !== 'object') return null;
  const input = body as Record<string, unknown>;
  if (typeof input.userId !== 'string' || !input.userId || typeof input.block !== 'boolean') return null;
  return {
    userId: input.userId,
    block: input.block,
    reason: typeof input.reason === 'string' ? input.reason : '',
    blockedUntil: typeof input.blockedUntil === 'string' ? input.blockedUntil : null,
  };
}

async function validateUserBlockCommand(
  command: UserBlockCommand,
  actorId: string | undefined,
): Promise<UserBlockValidation> {
  if (actorId === command.userId) {
    return { ok: false, outcome: 'DENIED', message: 'Du kannst dein eigenes Konto nicht sperren.', status: 409 };
  }

  const target = await db.user.findUnique({ where: { id: command.userId }, select: { role: true } });
  if (!target) {
    return { ok: false, outcome: 'FAILED', message: 'Benutzer wurde nicht gefunden.', status: 404 };
  }

  const adminBlockError = await getAdminBlockError(command.block, target.role);
  if (adminBlockError) {
    return { ok: false, outcome: 'DENIED', message: adminBlockError, status: 409 };
  }

  const until = command.block && command.blockedUntil ? new Date(command.blockedUntil) : null;
  if (until && Number.isNaN(until.getTime())) {
    return { ok: false, outcome: 'FAILED', message: 'Ungültiges Ablaufdatum.', status: 400 };
  }
  return { ok: true, until };
}

async function recordValidationFailure(
  audit: ReturnType<typeof adminMutationAudit.begin>,
  command: UserBlockCommand,
  validation: Exclude<UserBlockValidation, { ok: true }>,
) {
  const context = { target: { type: 'user' as const, id: command.userId } };
  if (validation.outcome === 'DENIED') {
    await audit.denied();
  } else {
    await audit.failed(context);
  }
  return Response.json({ error: validation.message }, { status: validation.status });
}

export async function POST(request: Request) {
  const authorizationAudit = adminMutationAudit.begin('user.block');
  if (!(await isCurrentUserAdmin())) {
    await authorizationAudit.denied();
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let audit = authorizationAudit;
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    await audit.failed();
    throw error;
  }

  if (body && typeof body === 'object' && 'block' in body && body.block === false) {
    audit = adminMutationAudit.begin('user.unblock');
  }
  const command = parseUserBlockCommand(body);
  if (!command) {
    await audit.failed();
    return Response.json({ error: 'Benutzer-ID und Sperrstatus sind erforderlich.' }, { status: 400 });
  }

  try {
    const admin = await currentUser();
    const validation = await validateUserBlockCommand(command, admin?.id);
    if (!validation.ok) return recordValidationFailure(audit, command, validation);

    const user = await db.user.update({
      where: { id: command.userId },
      data: {
        isBlocked: command.block,
        blockedAt: command.block ? new Date() : null,
        blockedUntil: command.block ? validation.until : null,
        blockedReason: command.block ? command.reason.trim() || null : null,
      },
      select: { id: true, isBlocked: true, blockedAt: true, blockedUntil: true, blockedReason: true },
    });
    await sessionSecurity.revokeAllSessions({
      userId: command.userId,
      event: command.block ? "account_blocked" : "account_unblocked",
      context: await currentSecurityContext(),
    });
    logBackendAction(
      command.block ? 'admin_user_blocked' : 'admin_user_unblocked',
      { userId: command.userId },
      'info',
    );
    await audit.succeeded({
      target: { type: 'user', id: command.userId },
      metadata: command.block ? {
        reasonCode: command.reason.trim() ? 'provided' : 'none',
        hasExpiry: Boolean(validation.until),
      } : undefined,
    });
    await invalidateAdminSummaries();
    return Response.json({ success: true, user });
  } catch (error) {
    await audit.failed({ target: { type: 'user', id: command.userId } });
    throw error;
  }
}
