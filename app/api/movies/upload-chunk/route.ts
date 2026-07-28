import { logBackendAction } from '@/lib/logger';

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

import { isCurrentUserAdmin } from "@/lib/admin-auth";
import {
  createMediaFilePath,
  getMediaFolders,
  isSafeUploadId,
  MAX_VIDEO_CHUNKS,
  MAX_VIDEO_CHUNK_SIZE,
  MAX_VIDEO_FILE_SIZE,
} from "@/lib/media-files";

function writeBuffer(
  stream: fs.WriteStream,
  buffer: Buffer,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleError = (error: Error) => {
      stream.off("drain", handleDrain);
      reject(error);
    };
    const handleDrain = () => {
      stream.off("error", handleError);
      resolve();
    };

    stream.once("error", handleError);
    if (stream.write(buffer)) {
      stream.off("error", handleError);
      resolve();
    } else {
      stream.once("drain", handleDrain);
    }
  });
}

function finishStream(stream: fs.WriteStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once("finish", resolve);
    stream.once("error", reject);
    stream.end();
  });
}

type ChunkPayload = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  size: number;
};

type ChunkUploadParameters = {
  chunk: ChunkPayload;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  fileId: string;
  videoType: "Movie" | "Serie";
  generatedId: string;
};

function readStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isChunkPayload(value: unknown): value is ChunkPayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { arrayBuffer?: unknown; size?: unknown };
  return typeof candidate.arrayBuffer === "function"
    && typeof candidate.size === "number";
}

function readUploadParameters(formData: FormData): ChunkUploadParameters | null {
  const chunk = formData.get("chunk");
  const chunkIndex = Number.parseInt(readStringField(formData, "chunkIndex"), 10);
  const totalChunks = Number.parseInt(readStringField(formData, "totalChunks"), 10);
  const fileName = readStringField(formData, "fileName");
  const fileId = readStringField(formData, "fileId");
  const videoType = readStringField(formData, "videoType");
  const generatedId = readStringField(formData, "generatedId");

  const isValid = isChunkPayload(chunk)
    && Number.isInteger(chunkIndex)
    && Number.isInteger(totalChunks)
    && chunkIndex >= 0
    && chunkIndex < totalChunks
    && totalChunks >= 1
    && totalChunks <= MAX_VIDEO_CHUNKS
    && chunk.size > 0
    && chunk.size <= MAX_VIDEO_CHUNK_SIZE
    && fileName.length > 0
    && isSafeUploadId(fileId)
    && isSafeUploadId(generatedId)
    && (videoType === "Movie" || videoType === "Serie");

  if (!isValid) return null;
  return {
    chunk,
    chunkIndex,
    totalChunks,
    fileName,
    fileId,
    videoType,
    generatedId,
  };
}

function ensureDirectory(directory: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function haveAllChunks(
  tempFolder: string,
  fileId: string,
  totalChunks: number,
): boolean {
  return Array.from({ length: totalChunks }, (_, index) => index)
    .every((index) => fs.existsSync(path.join(tempFolder, `${fileId}_${index}`)));
}

async function mergeChunks(
  finalPath: string,
  tempFolder: string,
  fileId: string,
  totalChunks: number,
): Promise<void> {
  const writeStream = fs.createWriteStream(finalPath, { flags: "wx" });
  const chunkPaths: string[] = [];
  let totalSize = 0;

  try {
    for (let index = 0; index < totalChunks; index++) {
      const currentChunkPath = path.join(tempFolder, `${fileId}_${index}`);
      const chunkBuffer = fs.readFileSync(currentChunkPath);
      totalSize += chunkBuffer.byteLength;
      if (totalSize > MAX_VIDEO_FILE_SIZE) {
        throw new Error("Video exceeds the maximum file size");
      }
      await writeBuffer(writeStream, chunkBuffer);
      chunkPaths.push(currentChunkPath);
    }
    await finishStream(writeStream);
    chunkPaths.forEach((currentChunkPath) => fs.unlinkSync(currentChunkPath));
  } catch (error) {
    writeStream.destroy();
    throw error;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function partialUploadResponse(parameters: ChunkUploadParameters): Response {
  logBackendAction(
    "api_movies_upload_chunk_partial_success",
    { chunkIndex: parameters.chunkIndex, fileId: parameters.fileId },
    "info",
  );
  return NextResponse.json({
    success: true,
    chunkIndex: parameters.chunkIndex,
    completed: false,
  });
}

async function completedUploadResponse(
  parameters: ChunkUploadParameters,
  finalPath: string,
  tempFolder: string,
): Promise<Response> {
  if (fs.existsSync(finalPath)) {
    return NextResponse.json({ error: "Video already exists" }, { status: 409 });
  }

  try {
    await mergeChunks(
      finalPath,
      tempFolder,
      parameters.fileId,
      parameters.totalChunks,
    );
    console.log("[UPLOAD-CHUNK] Response sent for completed upload:", finalPath);
    logBackendAction(
      "api_movies_upload_chunk_success",
      { filePath: finalPath, videoId: parameters.generatedId },
      "info",
    );
    return NextResponse.json({
      success: true,
      filePath: finalPath,
      videoId: parameters.generatedId,
      completed: true,
    });
  } catch (error) {
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    const errorMessage = getErrorMessage(error);
    console.error("Chunk merge error:", error);
    logBackendAction(
      "api_movies_upload_chunk_merge_error",
      { error: errorMessage },
      "error",
    );
    return NextResponse.json(
      { error: "Chunk merge failed", details: errorMessage, completed: false },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { movieFolder, seriesFolder } = getMediaFolders();

  try {
    const parameters = readUploadParameters(await req.formData());
    if (!parameters) {
      logBackendAction("api_movies_upload_chunk_missing_params", {}, "error");
      return NextResponse.json(
        { error: "Invalid upload parameters" },
        { status: 400 },
      );
    }

    const baseFolder = parameters.videoType === "Serie"
      ? seriesFolder
      : movieFolder;
    const tempFolder = path.join(baseFolder, "temp");
    const fileExtension = path.extname(parameters.fileName).toLowerCase();
    const finalPath = createMediaFilePath(
      baseFolder,
      `${parameters.generatedId}${fileExtension}`,
    );
    if (!finalPath) {
      return NextResponse.json(
        { error: "Unsupported or unsafe video file" },
        { status: 400 },
      );
    }

    ensureDirectory(baseFolder);
    ensureDirectory(tempFolder);

    const bytes = await parameters.chunk.arrayBuffer();
    const chunkPath = path.join(
      tempFolder,
      `${parameters.fileId}_${parameters.chunkIndex}`,
    );
    fs.writeFileSync(chunkPath, Buffer.from(bytes));

    if (!haveAllChunks(
      tempFolder,
      parameters.fileId,
      parameters.totalChunks,
    )) {
      return partialUploadResponse(parameters);
    }
    return completedUploadResponse(parameters, finalPath, tempFolder);
  } catch (error) {
    console.error("Chunk upload error:", error);
    logBackendAction(
      "api_movies_upload_chunk_error",
      { error: getErrorMessage(error) },
      "error",
    );
    return NextResponse.json({ error: "Chunk upload failed" }, { status: 500 });
  }
}
