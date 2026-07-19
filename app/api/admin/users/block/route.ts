import { NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logBackendAction } from "@/lib/logger";

export async function POST(req: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { userId, block } = await req.json();
    if (!userId || typeof block !== "boolean") {
      logBackendAction("api_admin_users_block_missing_param", { userId, block }, "error");
      return NextResponse.json({ error: "Missing userId or block flag" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { isBlocked: block },
      select: { id: true, isBlocked: true },
    });
    logBackendAction("api_admin_users_block_success", { userId, block }, "info");
    return NextResponse.json({ success: true, user });
  } catch (error) {
    logBackendAction("api_admin_users_block_error", { error: String(error) }, "error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
