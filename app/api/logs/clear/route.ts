import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";

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
    const logsDirectory = path.join(process.cwd(), "logs");
    const logFile = path.join(logsDirectory, "backend.log");
    fs.mkdirSync(logsDirectory, { recursive: true });
    fs.writeFileSync(logFile, "", "utf8");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: `Logs konnten nicht geleert werden: ${String(error)}` }, { status: 500 });
  }
}
