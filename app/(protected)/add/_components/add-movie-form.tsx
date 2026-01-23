"use client";
import { useTransition, useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";

import { addMovie } from "@/actions/add/add-movie";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MovieSchema } from "@/schemas";
import { MultiSelect } from "@/components/ui/multi-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChunkedUpload } from "@/hooks/useChunkedUpload";
import { Upload, X, Check, RefreshCw } from "lucide-react";

// Lese die Optionen aus den ENV-Variablen
const TYPE_OPTIONS = process.env.NEXT_PUBLIC_TYPE?.split(",") || ["Movie", "Serie"];
const GENRE_OPTIONS = process.env.NEXT_PUBLIC_GENRE?.split(",") || ["Action", "Comedy", "Drama"];

export const AddMovieForm = () => {
  const [isPending, startTransition] = useTransition();
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);
  const [thumbnailOptions, setThumbnailOptions] = useState<string[]>([]);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string>("");
  const [generatedVideoId, setGeneratedVideoId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { uploadFile, uploadProgress, isUploading, cancelUpload } = useChunkedUpload();
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const uploadStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isUploading && uploadStartTimeRef.current === null && uploadProgress > 0) {
      uploadStartTimeRef.current = Date.now();
    }
    if (!isUploading) {
      uploadStartTimeRef.current = null;
      setEstimatedTime("");
      return;
    }
    if (isUploading && videoFile && uploadProgress > 0 && uploadProgress < 100 && uploadStartTimeRef.current) {
      const elapsedMs = Date.now() - uploadStartTimeRef.current;
      const elapsedSec = elapsedMs / 1000;
      const progress = uploadProgress / 100;
      if (progress > 0) {
        const totalSec = elapsedSec / progress;
        const remainingSec = Math.max(0, totalSec - elapsedSec);
        const min = Math.floor(remainingSec / 60);
        const sec = Math.round(remainingSec % 60);
        setEstimatedTime(`${min > 0 ? min + 'm ' : ''}${sec}s`);
      } else {
        setEstimatedTime("");
      }
    }
  }, [isUploading, uploadProgress, videoFile]);

  const [allActors, setAllActors] = useState<{ id: string; name: string }[]>([]);
  const [actorsLoading, setActorsLoading] = useState(true);

  useEffect(() => {
    // Fetch all actors from backend
    const fetchActors = async () => {
      setActorsLoading(true);
      try {
        const res = await fetch("/api/actors/all");
        const data = await res.json();
        // Backend liefert { actors: [...] }
        setAllActors(Array.isArray(data.actors) ? data.actors.map((a: any) => ({ id: a.id, name: a.name })) : []);
      } catch {
        setAllActors([]);
      }
      setActorsLoading(false);
    };
    fetchActors();
  }, []);

  const form = useForm<z.infer<typeof MovieSchema>>({
    resolver: zodResolver(MovieSchema),
    defaultValues: {
      movieName: "",
      movieDescripton: "",
      movieActor: [],
      movieType: "",
      movieGenre: "",
      movieDuration: "",
      movieVideo: "",
      movieThumbnail: "",
    },
  });

  // Math.random() is safe to use here because video IDs only need to be unique for temporary client-side identification
  // and do not require cryptographic security. This is not used for authentication, authorization, or sensitive data.
  const generateVideoId = () => {
    return `video_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);

    // Generiere ID für das Video
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

      form.setValue("movieDuration", formattedDuration);
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

    // Startpunkt mit Offset verschieben (z.B. 0%, 10%, 20%, etc.)
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
        const offset = duration * offsetPercentage * 0.1; // 10% Verschiebung pro Klick
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
    // Erzeuge neue Thumbnails mit zufälligem Offset
    // Math.random() is safe here because the offset is only used for thumbnail generation and does not require cryptographic security.
    const randomOffset = Math.floor(Math.random() * 10) * 10; // 0-90%
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

  const uploadVideo = async () => {
    if (!videoFile) {
      toast.error("Please select a video first!");
      return;
    }

    const videoType = form.getValues("movieType");
    if (!videoType) {
      toast.error("Please select a type!");
      return;
    }

    const result = await uploadFile(videoFile, videoType, generatedVideoId);

    if (result) {
      setUploadedVideoPath(result.filePath);
      form.setValue("movieVideo", result.videoId); 
      toast.success("Video successfully uploaded!");

      setTimeout(() => {
        generateThumbnails();
      }, 500);
    }
  };

  const handleCancelUpload = async () => {
    if (isUploading) {
      cancelUpload();
      resetUploadState();
      toast.success("Upload abgebrochen!");
      return;
    }
    if (!uploadedVideoPath) {
      resetUploadState();
      toast.success("Cancelled!");
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
  };

  const resetUploadState = () => {
    setVideoFile(null);
    setVideoPreviewUrl("");
    setUploadedVideoPath("");
    setGeneratedVideoId("");
    setThumbnailUrl("");
    setThumbnailOptions([]);
    setShowThumbnailSelector(false);
    form.setValue("movieVideo", "");
    form.setValue("movieDuration", "");

    const fileInput = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
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

  const onSubmit = async (values: z.infer<typeof MovieSchema>) => {
    if (!thumbnailUrl) {
      toast.error("Please select a thumbnail!");
      return;
    }

    startTransition(() => {
      addMovie(values, thumbnailUrl).then((data) => {
        if (data?.error) {
          form.reset();
          toast.error(data?.error);
        }

        if (data?.success) {
          form.reset();
          form.setValue("movieActor", []);
          form.setValue("movieType", "");
          form.setValue("movieGenre", "");
          setThumbnailUrl("");
          setVideoFile(null);
          setVideoPreviewUrl("");
          setThumbnailOptions([]);
          setUploadedVideoPath("");
          setGeneratedVideoId("");
          toast.success(data?.success);
        }
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col gap-2 mx-4">
          <FormField
            control={form.control}
            name="movieName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Name</FormLabel>
                <FormControl>
                  <Input
                    className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                    {...field}
                    disabled={isPending}
                    placeholder=""
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="movieDescripton"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Descripton</FormLabel>
                <FormControl>
                  <Input
                    className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                    {...field}
                    disabled={isPending}
                    placeholder=""
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="movieActor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Actors</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={allActors.map(a => ({ label: a.name, value: a.id }))}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending || actorsLoading}
                    placeholder="Select actors..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-2">
            <FormField
              control={form.control}
              name="movieType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-white bg-zinc-800 h-10 border-gray-500">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 text-white border-gray-500">
                      {TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type} className="hover:bg-zinc-700">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="movieGenre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Genre</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-white bg-zinc-800 h-10 border-gray-500">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 text-white border-gray-500">
                      {GENRE_OPTIONS.map((genre) => (
                        <SelectItem key={genre} value={genre} className="hover:bg-zinc-700">
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="movieDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Duration</FormLabel>
                  <FormControl>
                    <Input
                      className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                      {...field}
                      disabled={isPending}
                      placeholder="xx:xx:xx"
                      type="text"
                      readOnly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormLabel className="text-white">Upload Video</FormLabel>
            <div className="mt-2 space-y-3">
              <div className="relative">
                <input
                  id="video-upload"
                  className="hidden"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isPending || isUploading}
                />
                <label
                  htmlFor="video-upload"
                  className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${videoFile
                      ? "border-green-500 bg-green-900/20"
                      : "border-gray-500 bg-zinc-800 hover:bg-zinc-700 hover:border-gray-400"
                    } ${(isPending || isUploading) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    {videoFile ? (
                      <>
                        <Check className="w-10 h-10 text-green-500 mb-2" />
                        <p className="text-sm text-white font-medium truncate max-w-xs px-2" title={videoFile.name}>
                          {videoFile.name.length > 40
                            ? `${videoFile.name.substring(0, 37)}...`
                            : videoFile.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        {generatedVideoId && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            ID: {generatedVideoId}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-white">
                          Click to select a video
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          MP4 file, max. 2GB
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {videoFile && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={uploadVideo}
                    disabled={isUploading || isPending || !!uploadedVideoPath}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
                  >
                    {(() => {
                      if (isUploading) {
                        return <><Upload className="w-4 h-4 mr-2 animate-pulse" />Uploading... {uploadProgress}%</>;
                      }
                      if (uploadedVideoPath) {
                        return <><Check className="w-4 h-4 mr-2" />Uploaded</>;
                      }
                      return <><Upload className="w-4 h-4 mr-2" />Upload Video</>;
                    })()}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancelUpload}
                    disabled={isPending}
                    className="h-11 px-4 bg-zinc-700 hover:bg-zinc-600 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {isUploading && (
                <div className="w-full">
                  <div className="bg-zinc-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{uploadProgress}%</span>
                    {estimatedTime && <span>~{estimatedTime} left</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Video Preview (versteckt) */}
          {videoPreviewUrl && (
            <div className="hidden">
              {/* NOSONAR */}
              <video ref={videoRef} src={videoPreviewUrl}>
              </video>
              <canvas ref={canvasRef} />
            </div>
          )}

          {showThumbnailSelector && thumbnailOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-white">Select Thumbnail</FormLabel>
                <Button
                  type="button"
                  onClick={regenerateThumbnails}
                  className="h-8 px-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {thumbnailOptions.map((thumb, index) => (
                  <button
                    type="button"
                    key={thumb}
                    onClick={() => selectThumbnail(thumb)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        selectThumbnail(thumb);
                      }
                    }}
                    className="w-full h-auto p-0 border-2 border-transparent hover:border-red-600 rounded transition-all focus:outline-none focus:ring-2 focus:ring-red-600"
                    aria-label={`Select thumbnail ${index + 1}`}
                  >
                    <img
                      src={thumb}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-auto rounded"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {thumbnailUrl && !showThumbnailSelector && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-white">Selected Thumbnail</FormLabel>
                <Button
                  type="button"
                  onClick={deselectThumbnail}
                  className="h-8 px-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Deselect
                </Button>
              </div>
              <img
                src={thumbnailUrl}
                alt="Selected Thumbnail"
                className="w-full h-auto rounded border-2 border-green-500"
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="movieThumbnail"
            render={() => (
              <FormItem>
                <FormLabel className="text-white">
                  Or upload thumbnail manually
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <input
                      id="thumbnail-upload"
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={(e: any) => createDataUri(e)}
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700 hover:border-gray-400 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-gray-400">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Upload Thumbnail</span>
                      </div>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="movieVideo"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="px-32 mt-4">
            <Button type="submit" disabled={isPending} variant="save" size="lg">
              Save
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};