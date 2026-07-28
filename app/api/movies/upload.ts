import { logBackendAction } from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import {
  createMediaFilePath,
  getMediaFolders,
  MAX_VIDEO_FILE_SIZE,
} from "@/lib/media-files";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { movieFolder } = getMediaFolders();

  // Check content-length header
  const contentLength = req.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_VIDEO_FILE_SIZE) {
    logBackendAction('api_movies_upload_too_large', { contentLength }, 'error');
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const formData = await req.formData();
  const file = formData.get("video");

  if (
    !file
    || typeof file !== "object"
    || !("name" in file)
    || !("size" in file)
    || !("stream" in file)
    || typeof file.name !== "string"
    || typeof file.size !== "number"
    || typeof file.stream !== "function"
  ) {
    logBackendAction('api_movies_upload_no_file', {}, 'error');
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Check file size property if available
  if (file.size <= 0 || file.size > MAX_VIDEO_FILE_SIZE) {
    logBackendAction('api_movies_upload_too_large_file', { size: file.size }, 'error');
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const filePath = createMediaFilePath(movieFolder, file.name);
  if (!filePath || ("type" in file && typeof file.type === "string" && file.type && !file.type.startsWith("video/"))) {
    return NextResponse.json({ error: "Unsupported or unsafe video file" }, { status: 400 });
  }

  try {
    if (!fs.existsSync(movieFolder)) {
      fs.mkdirSync(movieFolder, { recursive: true });
    }
    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File already exists" }, { status: 409 });
    }

    const input = Readable.fromWeb(
      file.stream() as unknown as NodeReadableStream<Uint8Array>,
    );
    await pipeline(input, fs.createWriteStream(filePath, { flags: "wx" }));

    logBackendAction('api_movies_upload_success', { filePath }, 'info');
    return NextResponse.json({ success: true, filePath });
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    logBackendAction('api_movies_upload_error', { error: String(error) }, 'error');
    return NextResponse.json({ error: "File save failed" }, { status: 500 });
  }
}
