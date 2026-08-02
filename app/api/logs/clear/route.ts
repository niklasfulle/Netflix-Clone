import { NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { backendLogStore } from "@/lib/log-store";

const CONFIRMATION = "LOGS LÖSCHEN";

export async function POST(request?: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { confirmation } = request
    ? await request.json().catch(() => ({ confirmation: "" }))
    : { confirmation: CONFIRMATION };
  if (confirmation !== CONFIRMATION) {
    return NextResponse.json({ error: `Zur Bestätigung muss „${CONFIRMATION}“ eingegeben werden.` }, { status: 400 });
  }

  try {
    await backendLogStore.clear();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Logs could not be cleared." }, { status: 500 });
  }
}
