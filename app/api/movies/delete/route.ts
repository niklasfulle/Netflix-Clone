import { logBackendAction } from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { resolveAllowedMediaPath } from "@/lib/media-files";

export async function DELETE(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { filePath } = await req.json();

    if (typeof filePath !== "string" || !filePath) {
      logBackendAction('api_movies_delete_no_file_path', {}, 'error');
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }

    const resolvedFilePath = resolveAllowedMediaPath(filePath);
    if (!resolvedFilePath) {
      logBackendAction('api_movies_delete_unsafe_file_path', {}, 'error');
      return NextResponse.json({ error: "Unsafe file path" }, { status: 400 });
    }

    // Prüfe ob die Datei existiert
    if (fs.existsSync(resolvedFilePath)) {
      fs.unlinkSync(resolvedFilePath);
      logBackendAction('api_movies_delete_success', { filePath: resolvedFilePath }, 'info');
      return NextResponse.json({ success: true, message: "Video deleted" });
    } else {
      logBackendAction('api_movies_delete_file_not_found', { filePath: resolvedFilePath }, 'error');
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Delete error:", error);
    logBackendAction('api_movies_delete_error', { error: String(error) }, 'error');
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
