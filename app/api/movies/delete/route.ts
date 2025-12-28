import { logBackendAction } from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function DELETE(req: NextRequest) {
  try {
    const { filePath } = await req.json();

    if (!filePath) {
      logBackendAction('api_movies_delete_no_file_path', {}, 'error');
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }

    // Prüfe ob die Datei existiert
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logBackendAction('api_movies_delete_success', { filePath }, 'info');
      return NextResponse.json({ success: true, message: "Video deleted" });
    } else {
      logBackendAction('api_movies_delete_file_not_found', { filePath }, 'error');
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Delete error:", error);
    logBackendAction('api_movies_delete_error', { error: String(error) }, 'error');
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}