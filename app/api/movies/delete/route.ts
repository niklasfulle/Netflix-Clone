import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function DELETE(req: NextRequest) {
  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }

    // Prüfe ob die Datei existiert
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: "Video deleted" });
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}