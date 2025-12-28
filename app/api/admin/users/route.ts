import { logBackendAction } from '@/lib/logger';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profil: {
          select: {
            id: true,
            name: true,
            image: true,
            inUse: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fallback für isBlocked falls nicht im Schema
    const usersWithBlocked = users.map((user) => ({
      ...user,
      isBlocked: false, 
      profiles: user.profil,
      profil: undefined,
    }));

    logBackendAction('api_admin_users_route_success', { userCount: usersWithBlocked.length }, 'info');
    return NextResponse.json(usersWithBlocked);
  } catch (error) {
    logBackendAction('api_admin_users_route_error', { error: String(error) }, 'error');
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
