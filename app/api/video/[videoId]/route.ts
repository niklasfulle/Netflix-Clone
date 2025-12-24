import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const range = req.headers.get("range");
    
    // Hole Movie-Daten aus der Datenbank
    const movie = await db.movie.findUnique({
      where: { id: videoId },
    });

    if (!movie) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Bestimme den richtigen Ordner basierend auf dem Typ
    const MOVIE_FOLDER = process.env.MOVIE_FOLDER || "./movies";
    const SERIES_FOLDER = process.env.SERIES_FOLDER || "./series";
    const baseFolder = movie.type === "Serie" ? SERIES_FOLDER : MOVIE_FOLDER;

    // Finde die Video-Datei mit verschiedenen Erweiterungen
    const extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    let videoPath = "";
    
    for (const ext of extensions) {
      const testPath = path.join(baseFolder, `${movie.videoUrl}${ext}`);
      if (fs.existsSync(testPath)) {
        videoPath = testPath;
        break;
      }
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }

    const videoSize = fs.statSync(videoPath).size;

    // Wenn kein Range-Header, sende ganzes Video
    if (!range) {
      const head = {
        "Content-Length": videoSize.toString(),
        "Content-Type": "video/mp4",
      };
      const stream = fs.createReadStream(videoPath);
      return new NextResponse(stream as any, { status: 200, headers: head });
    }

    // Parse Range-Header
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });

    const head = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize.toString(),
      "Content-Type": "video/mp4",
    };

    return new NextResponse(file as any, { status: 206, headers: head });
  } catch (error) {
    console.error("Video streaming error:", error);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}