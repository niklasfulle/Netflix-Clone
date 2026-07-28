import { NextRequest, NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  createVideoStreamResponse,
  resolveVideoFile,
} from "@/lib/video-stream";

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

    if (!movie || (movie.status !== "PUBLISHED" && !(await isCurrentUserAdmin()))) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Bestimme den richtigen Ordner basierend auf dem Typ
    const MOVIE_FOLDER = process.env.MOVIE_FOLDER || "./movies";
    const SERIES_FOLDER = process.env.SERIES_FOLDER || "./series";
    const baseFolder = movie.type === "Serie" ? SERIES_FOLDER : MOVIE_FOLDER;

    const videoPath = resolveVideoFile(baseFolder, movie.videoUrl);
    if (!videoPath) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }

    return createVideoStreamResponse(videoPath, range);
  } catch (error) {
    console.error("Video streaming error:", error);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}
