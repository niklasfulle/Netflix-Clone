import { useRef, useState } from "react";
import { useChunkedUpload } from "./useChunkedUpload";
import { toast } from "react-hot-toast";

export const useVideoThumbnailUpload = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);
  const [thumbnailOptions, setThumbnailOptions] = useState<string[]>([]);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string>("");
  const [generatedVideoId, setGeneratedVideoId] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { uploadFile, uploadProgress: chunkUploadProgress, isUploading, cancelUpload: cancelChunkUpload } = useChunkedUpload();

  const generateVideoId = () => {
    return `video_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  };

  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onDurationChange?: (duration: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);

    const videoId = generateVideoId();
    setGeneratedVideoId(videoId);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = previewUrl;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);

      let formattedDuration = "";
      if (hours > 0) {
        formattedDuration = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      } else {
        formattedDuration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }

      onDurationChange?.(formattedDuration);
      toast.success(`Video length: ${formattedDuration}`);
    };
  };

  const generateThumbnails = (startOffset: number = 0) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const duration = video.duration;
    const thumbnails: string[] = [];
    let captureCount = 0;
    const totalCaptures = 6;

    const offsetPercentage = startOffset / 100;

    const captureFrame = (time: number) => {
      video.currentTime = time;
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
      thumbnails.push(thumbnail);
      captureCount++;

      if (captureCount < totalCaptures) {
        const basePosition = (duration / totalCaptures) * captureCount;
        const offset = duration * offsetPercentage * 0.1;
        captureFrame(Math.min(basePosition + offset, duration - 1));
      } else {
        setThumbnailOptions(thumbnails);
        setShowThumbnailSelector(true);
      }
    };

    const firstFrameTime = Math.max(0, (duration / totalCaptures) * offsetPercentage);
    captureFrame(firstFrameTime);
  };

  const regenerateThumbnails = () => {
    const randomOffset = Math.floor(Math.random() * 10) * 10;
    generateThumbnails(randomOffset);
    toast.success("New thumbnails are being generated...");
  };

  const selectThumbnail = (thumbnail: string) => {
    setThumbnailUrl(thumbnail);
    setShowThumbnailSelector(false);
    toast.success("Thumbnail selected!");
  };

  const deselectThumbnail = () => {
    setThumbnailUrl("");
    setShowThumbnailSelector(true);
    toast.success("Thumbnail deselected!");
  };

  const uploadVideo = async (videoType: string, onVideoUploadSuccess?: (result: { filePath: string; videoId: string }) => void) => {
    if (!videoFile) {
      toast.error("Please select a video first!");
      return;
    }

    if (!videoType) {
      toast.error("Please select a type!");
      return;
    }

    const result = await uploadFile(videoFile, videoType, generatedVideoId);

    if (result) {
      setUploadedVideoPath(result.filePath);
      toast.success("Video uploaded successfully!");
      onVideoUploadSuccess?.(result);

      setTimeout(() => {
        generateThumbnails();
      }, 500);
    }
  };

  const createDataUri = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailUrl(reader.result as string);
      setShowThumbnailSelector(false);
    };
    reader.readAsDataURL(file);
  };

  const resetUploadState = () => {
    setVideoFile(null);
    setVideoPreviewUrl("");
    setUploadedVideoPath("");
    setGeneratedVideoId("");
    setThumbnailUrl("");
    setThumbnailOptions([]);
    setShowThumbnailSelector(false);

    const fileInput = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const cancelUpload = async (onCancel?: () => void) => {
    if (isUploading) {
      cancelChunkUpload();
      resetUploadState();
      toast.success("Upload abgebrochen!");
      onCancel?.();
      return;
    }

    if (!uploadedVideoPath) {
      resetUploadState();
      toast.success("Cancelled!");
      onCancel?.();
      return;
    }

    try {
      const response = await fetch("/api/movies/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath: uploadedVideoPath }),
      });

      const data = await response.json();

      if (data.success) {
        resetUploadState();
        toast.success("Video deleted!");
      } else {
        toast.error("Error deleting video!");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Error deleting video!");
    }

    onCancel?.();
  };

  return {
    // State
    videoFile,
    videoPreviewUrl,
    thumbnailUrl,
    showThumbnailSelector,
    thumbnailOptions,
    uploadedVideoPath,
    generatedVideoId,
    uploadProgress: chunkUploadProgress,
    isUploading,

    // Refs
    videoRef,
    canvasRef,

    // Methods
    handleVideoUpload,
    generateThumbnails,
    regenerateThumbnails,
    selectThumbnail,
    deselectThumbnail,
    uploadVideo,
    createDataUri,
    resetUploadState,
    cancelUpload,
    setThumbnailUrl,
    setVideoFile,
    setVideoPreviewUrl,
    setShowThumbnailSelector,
    setThumbnailOptions,
    setUploadedVideoPath,
    setGeneratedVideoId,
  };
};
