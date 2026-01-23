import { logBackendAction } from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Set a safe content length limit (e.g., 1GB)
const MAX_CONTENT_LENGTH = 1 * 1024 * 1024 * 1024; // 1GB

export async function POST(req: NextRequest) {
  const MOVIE_FOLDER = process.env.MOVIE_FOLDER || "./movies";

  // Check content-length header
  const contentLength = req.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
    logBackendAction('api_movies_upload_too_large', { contentLength }, 'error');
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const formData = await req.formData();
  const file = formData.get("video") as File;

  if (!file) {
    logBackendAction('api_movies_upload_no_file', {}, 'error');
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Check file size property if available
  if ('size' in file && file.size > MAX_CONTENT_LENGTH) {
    logBackendAction('api_movies_upload_too_large_file', { size: file.size }, 'error');
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!fs.existsSync(MOVIE_FOLDER)) {
      fs.mkdirSync(MOVIE_FOLDER, { recursive: true });
    }

    const filePath = path.join(MOVIE_FOLDER, file.name);
    fs.writeFileSync(filePath, buffer);

    logBackendAction('api_movies_upload_success', { filePath }, 'info');
    return NextResponse.json({ success: true, filePath });
  } catch (error) {
    logBackendAction('api_movies_upload_error', { error: String(error) }, 'error');
    return NextResponse.json({ error: "File save failed" }, { status: 500 });
  }
}
