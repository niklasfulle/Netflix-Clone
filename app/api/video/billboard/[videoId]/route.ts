import { NextRequest, NextResponse } from "next/server";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  createVideoStreamResponse,
  resolveVideoFile,
} from "@/lib/video-stream";

type BillboardRouteContext = { params: Promise<{ videoId: string }> };

async function findAccessibleMovie(videoId: string) {
  const movie = await db.movie.findUnique({ where: { id: videoId } });
  if (!movie || (movie.status !== "PUBLISHED" && !(await isCurrentUserAdmin()))) {
    return null;
  }
  return movie;
}

function resolveBillboardVideo(movie: { type: string; videoUrl: string }) {
  const movieFolder = process.env.MOVIE_FOLDER || "./movies";
  const seriesFolder = process.env.SERIES_FOLDER || "./series";
  const baseFolder = movie.type === "Serie" ? seriesFolder : movieFolder;
  return resolveVideoFile(baseFolder, movie.videoUrl);
}

export async function HEAD(
  _req: NextRequest,
  { params }: BillboardRouteContext,
) {
  const { videoId } = await params;
  const movie = await findAccessibleMovie(videoId);
  if (!movie) return new Response(null, { status: 404 });

  return new Response(null, {
    status: 204,
    headers: {
      "X-Video-Available": String(Boolean(resolveBillboardVideo(movie))),
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: BillboardRouteContext,
) {
  try {
    const { videoId } = await params;
    const range = req.headers.get("range");
    
    const movie = await findAccessibleMovie(videoId);
    if (!movie) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const videoPath = resolveBillboardVideo(movie);
    if (!videoPath) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }

    return createVideoStreamResponse(videoPath, range);
  } catch (error) {
    console.error("Billboard video streaming error:", error);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}
