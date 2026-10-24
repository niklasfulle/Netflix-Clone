import { useEffect, useRef, useState } from "react";
import { useChunkedUpload } from "./useChunkedUpload";
import { useUploadTitleNotification } from "./useUploadTitleNotification";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";

export const useVideoThumbnailUpload = () => {
  const { t, message } = useLanguage();
  const { notify: notifyUploadTitle, reset: resetUploadTitle } = useUploadTitleNotification();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);
  const [thumbnailOptions, setThumbnailOptions] = useState<string[]>([]);
  const [thumbnailTimestamps, setThumbnailTimestamps] = useState<number[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [thumbnailGenerationError, setThumbnailGenerationError] = useState(false);
  const [selectedThumbnailTimestamp, setSelectedThumbnailTimestamp] = useState<number | null>(null);
  const [thumbnailVideoDuration, setThumbnailVideoDuration] = useState(0);
  const [isAdjustingThumbnail, setIsAdjustingThumbnail] = useState(false);
  const [thumbnailAdjustmentError, setThumbnailAdjustmentError] = useState(false);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string>("");
  const [generatedVideoId, setGeneratedVideoId] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generationCleanupRef = useRef<(() => void) | null>(null);

  const cancelThumbnailGeneration = () => {
    generationCleanupRef.current?.();
    setIsGeneratingThumbnails(false);
    setIsAdjustingThumbnail(false);
  };

  useEffect(() => () => {
    generationCleanupRef.current?.();
  }, []);

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

    cancelThumbnailGeneration();
    setThumbnailOptions([]);
    setThumbnailTimestamps([]);
    setThumbnailGenerationError(false);
    setSelectedThumbnailTimestamp(null);
    setThumbnailVideoDuration(0);
    setThumbnailAdjustmentError(false);
    setShowThumbnailSelector(false);
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
      toast.success(message("videoLength", { duration: formattedDuration }));
    };
  };

  const generateThumbnails = (startOffset: number = 0) => {
    if (!videoRef.current || !canvasRef.current || generationCleanupRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const thumbnails: string[] = [];
    const timestamps: number[] = [];
    const totalCaptures = 6;
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      active = false;
      clearTimeout(timeout);
      video.onseeked = null;
      video.onerror = null;
      video.removeEventListener("loadedmetadata", startCapturing);
      generationCleanupRef.current = null;
    };

    const fail = () => {
      if (!active) return;
      cleanup();
      setIsGeneratingThumbnails(false);
      setThumbnailGenerationError(true);
    };

    const armTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(fail, 15000);
    };

    const startCapturing = () => {
      if (!active) return;
      try {
        video.removeEventListener("loadedmetadata", startCapturing);
        if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) {
          fail();
          return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fail();
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setThumbnailVideoDuration(video.duration);
        // Sample within each segment instead of seeking to the current frame at 0.
        const segmentOffset = Math.max(0.1, Math.min(0.9, startOffset / 100));
        const captureNextFrame = () => {
          armTimeout();
          video.currentTime = (video.duration / totalCaptures) * (thumbnails.length + segmentOffset);
        };
        video.onseeked = () => {
          if (!active) return;
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
            if (!thumbnail.startsWith("data:image/jpeg")) {
              fail();
              return;
            }
            thumbnails.push(thumbnail);
            timestamps.push(video.currentTime);
            setThumbnailOptions([...thumbnails]);
            setThumbnailTimestamps([...timestamps]);
            if (thumbnails.length < totalCaptures) {
              captureNextFrame();
            } else {
              cleanup();
              setIsGeneratingThumbnails(false);
            }
          } catch {
            fail();
          }
        };
        captureNextFrame();
      } catch {
        fail();
      }
    };

    generationCleanupRef.current = cleanup;
    setThumbnailOptions([]);
    setThumbnailTimestamps([]);
    setThumbnailGenerationError(false);
    setIsGeneratingThumbnails(true);
    setShowThumbnailSelector(true);
    video.onerror = fail;
    armTimeout();
    if (Number.isFinite(video.duration) && video.videoWidth > 0) {
      startCapturing();
    } else {
      video.addEventListener("loadedmetadata", startCapturing, { once: true });
    }
  };

  const regenerateThumbnails = () => {
    const randomOffset = 10 + Math.floor(Math.random() * 9) * 10;
    generateThumbnails(randomOffset);
  };

  const selectThumbnail = (thumbnail: string, timestamp?: number) => {
    cancelThumbnailGeneration();
    setThumbnailUrl(thumbnail);
    setSelectedThumbnailTimestamp(timestamp ?? thumbnailTimestamps[thumbnailOptions.indexOf(thumbnail)] ?? null);
    setThumbnailAdjustmentError(false);
    setShowThumbnailSelector(false);
    toast.success(t("Thumbnail selected!"));
  };

  const deselectThumbnail = () => {
    cancelThumbnailGeneration();
    setThumbnailUrl("");
    setSelectedThumbnailTimestamp(null);
    setThumbnailAdjustmentError(false);
    setShowThumbnailSelector(true);
    toast.success(t("Thumbnail deselected!"));
  };

  const adjustThumbnail = (seconds: -5 | 5) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || selectedThumbnailTimestamp === null || generationCleanupRef.current) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    const target = Math.max(0, Math.min(selectedThumbnailTimestamp + seconds, Math.max(0, video.duration - 0.05)));
    if (target === selectedThumbnailTimestamp) return;
    let active = true;
    const cleanup = () => {
      active = false;
      clearTimeout(timeout);
      video.onseeked = null;
      video.onerror = null;
      generationCleanupRef.current = null;
    };
    const fail = () => {
      if (!active) return;
      cleanup();
      setIsAdjustingThumbnail(false);
      setThumbnailAdjustmentError(true);
    };
    const capture = () => {
      if (!active) return;
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx || !video.videoWidth || !video.videoHeight) {
          fail();
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
        if (!thumbnail.startsWith("data:image/jpeg")) {
          fail();
          return;
        }
        cleanup();
        setThumbnailUrl(thumbnail);
        setSelectedThumbnailTimestamp(target);
        setIsAdjustingThumbnail(false);
      } catch {
        fail();
      }
    };
    const timeout = setTimeout(fail, 15000);
    generationCleanupRef.current = cleanup;
    setThumbnailAdjustmentError(false);
    setIsAdjustingThumbnail(true);
    video.onseeked = capture;
    video.onerror = fail;
    try {
      if (Math.abs(video.currentTime - target) < 0.001 && video.readyState >= 2 && !video.seeking) {
        capture();
      } else {
        video.currentTime = target;
      }
    } catch {
      fail();
    }
  };

  const uploadVideo = async (videoType: string, onVideoUploadSuccess?: (result: { filePath: string; videoId: string }) => void) => {
    if (!videoFile) {
      toast.error(t("Please select a video first!"));
      return;
    }

    if (!videoType) {
      toast.error(t("Please select a type!"));
      return;
    }

    resetUploadTitle();
    const result = await uploadFile(videoFile, videoType, generatedVideoId);

    if (result) {
      setUploadedVideoPath(result.filePath);
      toast.success(t("Video uploaded successfully!"));
      notifyUploadTitle(t("Upload complete"));
      onVideoUploadSuccess?.(result);

      generateThumbnails();
    }
  };

  const createDataUri = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      cancelThumbnailGeneration();
      setSelectedThumbnailTimestamp(null);
      setThumbnailAdjustmentError(false);
      setThumbnailUrl(reader.result as string);
      setShowThumbnailSelector(false);
    };
    reader.readAsDataURL(file);
  };

  const resetUploadState = () => {
    cancelThumbnailGeneration();
    resetUploadTitle();
    if (videoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL?.(videoPreviewUrl);
    }

    setVideoFile(null);
    setVideoPreviewUrl("");
    setUploadedVideoPath("");
    setGeneratedVideoId("");
    setThumbnailUrl("");
    setThumbnailOptions([]);
    setThumbnailTimestamps([]);
    setThumbnailGenerationError(false);
    setSelectedThumbnailTimestamp(null);
    setThumbnailVideoDuration(0);
    setThumbnailAdjustmentError(false);
    setShowThumbnailSelector(false);

    for (const inputId of ["video-upload", "thumbnail-upload"]) {
      const fileInput = document.getElementById(inputId) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    }
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
      toast.success(t("Cancelled!"));
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
        toast.success(t("Video deleted!"));
      } else {
        toast.error(t("Error deleting video!"));
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error(t("Error deleting video!"));
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
    thumbnailTimestamps,
    isGeneratingThumbnails,
    thumbnailGenerationError,
    selectedThumbnailTimestamp,
    thumbnailVideoDuration,
    isAdjustingThumbnail,
    thumbnailAdjustmentError,
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
    adjustThumbnail,
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
