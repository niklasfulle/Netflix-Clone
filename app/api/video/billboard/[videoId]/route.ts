import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { Readable } from "node:stream";

import { db } from "@/lib/db";
import {
  getVideoContentType,
  parseVideoRange,
  resolveVideoFile,
} from "@/lib/video-stream";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const range = req.headers.get("range");
    
    const movie = await db.movie.findUnique({
      where: { id: videoId },
    });

    if (!movie) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const MOVIE_FOLDER = process.env.MOVIE_FOLDER || "./movies";
    const SERIES_FOLDER = process.env.SERIES_FOLDER || "./series";
    const baseFolder = movie.type === "Serie" ? SERIES_FOLDER : MOVIE_FOLDER;

    const videoPath = resolveVideoFile(baseFolder, movie.videoUrl);
    if (!videoPath) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }

    const videoSize = fs.statSync(videoPath).size;
    if (videoSize === 0) {
      return NextResponse.json({ error: "Video file is empty" }, { status: 404 });
    }

    const contentType = getVideoContentType(videoPath);
    const commonHeaders = {
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      "Content-Type": contentType,
    };

    if (!range) {
      const stream = Readable.toWeb(fs.createReadStream(videoPath));
      return new NextResponse(stream as ReadableStream, {
        status: 200,
        headers: {
          ...commonHeaders,
          "Content-Length": videoSize.toString(),
        },
      });
    }

    const parsedRange = parseVideoRange(range, videoSize);
    if (!parsedRange) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...commonHeaders,
          "Content-Range": `bytes */${videoSize}`,
        },
      });
    }

    const { start, end } = parsedRange;
    const chunkSize = end - start + 1;
    const stream = Readable.toWeb(fs.createReadStream(videoPath, { start, end }));

    return new NextResponse(stream as ReadableStream, {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Content-Length": chunkSize.toString(),
      },
    });
  } catch (error) {
    console.error("Billboard video streaming error:", error);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}
