
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest): Promise<Response> {
  const MOVIE_FOLDER = process.env.MOVIE_FOLDER || "./movies";
  const SERIES_FOLDER = process.env.SERIES_FOLDER || "./series";

  try {
    const formData = await req.formData();
    const chunk = formData.get("chunk") as File;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileName = formData.get("fileName") as string;
    const fileId = formData.get("fileId") as string;
    const videoType = formData.get("videoType") as string; // "Movie" oder "Serie"
    const generatedId = formData.get("generatedId") as string;

    if (!chunk || chunkIndex === undefined || !totalChunks || !fileName || !fileId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Wähle den richtigen Ordner basierend auf dem Typ
    const BASE_FOLDER = videoType === "Serie" ? SERIES_FOLDER : MOVIE_FOLDER;
    const TEMP_FOLDER = path.join(BASE_FOLDER, "temp");

    // Erstelle Ordner falls nicht vorhanden
    if (!fs.existsSync(BASE_FOLDER)) {
      fs.mkdirSync(BASE_FOLDER, { recursive: true });
    }
    if (!fs.existsSync(TEMP_FOLDER)) {
      fs.mkdirSync(TEMP_FOLDER, { recursive: true });
    }

    // Speichere Chunk
    const bytes = await chunk.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const chunkPath = path.join(TEMP_FOLDER, `${fileId}_${chunkIndex}`);
    fs.writeFileSync(chunkPath, buffer);

    // Prüfe ob alle Chunks vorhanden sind
    const allChunksReceived = Array.from({ length: totalChunks }, (_, i) => i)
      .every(i => fs.existsSync(path.join(TEMP_FOLDER, `${fileId}_${i}`)));

    if (allChunksReceived) {
      // Dateiendung extrahieren
      const fileExtension = path.extname(fileName);
      // Neuer Dateiname mit generierter ID
      const newFileName = `${generatedId}${fileExtension}`;
      const finalPath = path.join(BASE_FOLDER, newFileName);
      
      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(TEMP_FOLDER, `${fileId}_${i}`);
        const chunkBuffer = fs.readFileSync(chunkPath);
        writeStream.write(chunkBuffer);
        fs.unlinkSync(chunkPath); // Lösche Chunk nach dem Zusammenfügen
      }
      writeStream.end(); // Wichtig: Stream korrekt beenden, damit 'finish' ausgelöst wird

      try {
        await new Promise<void>((resolve, reject) => {
          writeStream.on("finish", () => {
            console.log("[UPLOAD-CHUNK] WriteStream finished, sending response for final chunk.");
            resolve();
          });
          writeStream.on("error", (err) => {
            console.error("[UPLOAD-CHUNK] WriteStream error:", err);
            reject(err);
          });
        });
        console.log("[UPLOAD-CHUNK] Response sent for completed upload:", finalPath);
        return NextResponse.json({ 
          success: true, 
          filePath: finalPath,
          videoId: generatedId,
          completed: true 
        });
      } catch (err: any) {
        console.error("Chunk merge error:", err);
        return NextResponse.json({ error: "Chunk merge failed", details: err?.message || String(err), completed: false }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      chunkIndex,
      completed: false 
    });

  } catch (error) {
    console.error("Chunk upload error:", error);
    return NextResponse.json({ error: "Chunk upload failed" }, { status: 500 });
  }
}