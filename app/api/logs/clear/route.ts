import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function POST() {
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
