import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isCurrentUserAdmin } from "@/lib/admin-auth";

export async function POST() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const logsDir = path.join(process.cwd(), "logs");
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(logsDir, file));
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
