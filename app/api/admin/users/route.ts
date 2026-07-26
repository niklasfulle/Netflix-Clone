import type { Prisma, UserRole } from "@prisma/client";

import { currentUser } from "@/lib/auth";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";

export const dynamic = "force-dynamic";

function boundedNumber(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), max) : fallback;
}

export async function GET(request: Request = new Request("http://localhost/api/admin/users")) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = boundedNumber(searchParams.get("page"), 1, 100_000);
  const pageSize = boundedNumber(searchParams.get("pageSize"), 20, 100);
  const search = searchParams.get("search")?.trim() || "";
  const role = searchParams.get("role") || "all";
  const status = searchParams.get("status") || "all";
  const twoFactor = searchParams.get("twoFactor") || "all";
  const requestedSort = searchParams.get("sort") || "createdAt";
  const sort = ["name", "email", "role", "createdAt", "isBlocked"].includes(requestedSort) ? requestedSort : "createdAt";
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";

  const where: Prisma.UserWhereInput = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(role !== "all" && { role: role as UserRole }),
    ...(status === "active" && { isBlocked: false }),
    ...(status === "blocked" && { isBlocked: true }),
    ...(twoFactor === "enabled" && { isTwoFactorEnabled: true }),
    ...(twoFactor === "disabled" && { isTwoFactorEnabled: false }),
  };

  const [total, users, activeCount, blockedCount, adminCount] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isBlocked: true,
        blockedAt: true,
        blockedUntil: true,
        blockedReason: true,
        isTwoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        profil: {
          select: { id: true, name: true, image: true, inUse: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { [sort]: direction },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where: { isBlocked: false } }),
    db.user.count({ where: { isBlocked: true } }),
    db.user.count({ where: { role: "ADMIN" } }),
  ]);

  return Response.json({
    users: users.map(({ profil, ...user }) => ({ ...user, profiles: profil })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    counts: { active: activeCount, blocked: blockedCount, admins: adminCount },
  });
}

export async function PATCH(request: Request) {
  if (!(await isCurrentUserAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const actor = await currentUser();
  const { userId, role } = await request.json();
  if (!userId || !["ADMIN", "USER"].includes(role)) {
    return Response.json({ error: "Ungültige Benutzer-ID oder Rolle." }, { status: 400 });
  }
  if (actor?.id === userId && role !== "ADMIN") {
    return Response.json({ error: "Du kannst deine eigene Admin-Rolle nicht entfernen." }, { status: 409 });
  }

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return Response.json({ error: "Benutzer wurde nicht gefunden." }, { status: 404 });
  if (target.role === "ADMIN" && role === "USER") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) return Response.json({ error: "Der letzte Administrator kann nicht herabgestuft werden." }, { status: 409 });
  }

  const user = await db.user.update({ where: { id: userId }, data: { role }, select: { id: true, role: true } });
  logBackendAction("admin_user_role_changed", { userId, role }, "info");
  return Response.json({ success: true, user });
}
