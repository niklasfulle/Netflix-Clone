import { logBackendAction } from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const form = new formidable.IncomingForm();
  const MOVIE_FOLDER = process.env.MOVIE_FOLDER || "./movies";

  const formData = await req.formData();
  const file = formData.get("video") as File;

  if (!file) {
    logBackendAction('api_movies_upload_no_file', {}, 'error');
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
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
