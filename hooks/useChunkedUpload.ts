import { useState } from "react";
import { toast } from "react-hot-toast";

export const useChunkedUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File, videoType: string, generatedId: string): Promise<{ filePath: string; videoId: string } | null> => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB pro Chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
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

        const response = await fetch("/api/movies/upload-chunk", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Chunk upload failed");
        }

        const data = await response.json();
        
        // Update Progress
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadProgress(progress);

        // Wenn alle Chunks hochgeladen wurden
        if (data.completed) {
          setIsUploading(false);
          setUploadProgress(100);
          return { filePath: data.filePath, videoId: data.videoId };
        }
      }

      throw new Error("Upload incomplete");
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);
      toast.error("Upload fehlgeschlagen!");
      return null;
    }
  };

  return { uploadFile, uploadProgress, isUploading };
};