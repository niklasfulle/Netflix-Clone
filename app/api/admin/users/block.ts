import { logBackendAction } from '@/lib/logger';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId, block } = await req.json();
    if (!userId || typeof block !== "boolean") {
      logBackendAction('api_admin_users_block_missing_param', { userId, block }, 'error');
      return NextResponse.json({ error: "Missing userId or block flag" }, { status: 400 });
    }
    // Falls das Feld isBlocked nicht existiert, bitte im Prisma-Schema ergänzen!
    const user = await db.user.update({
      where: { id: userId },
      data: { isBlocked: block },
    });
    logBackendAction('api_admin_users_block_success', { userId, block }, 'info');
    return NextResponse.json({ success: true, user });
  } catch (error) {
    logBackendAction('api_admin_users_block_error', { error: String(error) }, 'error');
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
