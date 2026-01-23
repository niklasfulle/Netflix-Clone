import { useState, useRef } from "react";
import { toast } from "react-hot-toast";

export const useChunkedUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadFile = async (file: File, videoType: string, generatedId: string): Promise<{ filePath: string; videoId: string } | null> => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB pro Chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    // Use crypto.getRandomValues for better randomness and avoid deprecated substr
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(9)))
      .map(b => b.toString(36).padStart(2, '0'))
      .join('');
    const fileId = `${Date.now()}_${randomPart}`;

    setIsUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();
    console.log('[UPLOAD] Starte Upload:', { fileName: file.name, totalChunks, fileId, videoType, generatedId });

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Upload abgebrochen!");
        }
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("totalChunks", totalChunks.toString());
        formData.append("fileName", file.name);
        formData.append("fileId", fileId);
        formData.append("videoType", videoType);
        formData.append("generatedId", generatedId);

        console.log(`[UPLOAD] Sende Chunk ${chunkIndex + 1}/${totalChunks} (Bytes ${start}-${end})`);
        const response = await fetch("/api/movies/upload-chunk", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        let data;
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.error(`[UPLOAD] Fehler beim Parsen der Response für Chunk ${chunkIndex + 1}:`, jsonErr);
          throw new Error("Chunk upload failed");
        }

        if (!response.ok) {
          // Show backend error if available
          const errorMsg = data?.error || "Chunk upload failed";
          console.error(`[UPLOAD] Fehler vom Server für Chunk ${chunkIndex + 1}:`, errorMsg, data);
          throw new Error(errorMsg);
        }

        // Update Progress
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadProgress(progress);
        console.log(`[UPLOAD] Chunk ${chunkIndex + 1}/${totalChunks} erfolgreich, Fortschritt: ${progress}%`, data);

        // Wenn alle Chunks hochgeladen wurden
        if (data.completed) {
          setIsUploading(false);
          setUploadProgress(100);
          console.log('[UPLOAD] Upload abgeschlossen! Server-Response:', data);
          abortControllerRef.current = null;
          return { filePath: data.filePath, videoId: data.videoId };
        }
      }

      console.error('[UPLOAD] Upload unvollständig – nicht alle Chunks wurden bestätigt!');
      throw new Error("Upload incomplete");
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Upload abgebrochen!' || error === 'cancelled by user') {
        toast.error('Upload abgebrochen!');
        setIsUploading(false);
        setUploadProgress(0);
        abortControllerRef.current = null;
        console.info("[UPLOAD] Upload wurde vom Nutzer abgebrochen.");
        return null;
      } else {
        toast.error(error?.message || "Upload fehlgeschlagen!");
        setIsUploading(false);
        setUploadProgress(0);
        abortControllerRef.current = null;
        console.error("[UPLOAD] Fehler im Upload-Prozess:", error);
        return null;
      }
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      // Grund für den Abbruch mitgeben (vermeidet Warnung)
      abortControllerRef.current.abort("cancelled by user");
    }
  };

  return { uploadFile, uploadProgress, isUploading, cancelUpload };
};