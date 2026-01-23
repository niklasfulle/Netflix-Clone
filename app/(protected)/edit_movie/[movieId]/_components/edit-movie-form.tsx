"use client";
import Image from "next/image";
import { useTransition, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { updateMovie } from "@/actions/add/update-movie";
import { MultiSelect } from "@/components/ui/multi-select";
import useActorsAll from "@/hooks/useActorsAll";
import { deleteMovie } from "@/actions/add/delete-movie";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useChunkedUpload } from "@/hooks/useChunkedUpload";
import { Upload, X, Check, RefreshCw, Trash2 } from "lucide-react";

// Lese die Optionen aus den ENV-Variablen
const TYPE_OPTIONS = process.env.NEXT_PUBLIC_TYPE?.split(",") || ["Movie", "Serie"];
const GENRE_OPTIONS = process.env.NEXT_PUBLIC_GENRE?.split(",") || ["Action", "Comedy", "Drama"];

interface EditMovieFormProps {
  movie: Record<string, any>;
}

export const EditMovieForm = ({ movie }: EditMovieFormProps) => {
  const { actors: actorOptionsRaw, isLoading: actorsLoading } = useActorsAll();
  let actorSelectOptions: { label: string; value: string }[] = [];
  if (Array.isArray(actorOptionsRaw?.actors)) {
    actorSelectOptions = actorOptionsRaw.actors.map((a: any) => ({ label: a.name, value: a.id }));
  } else if (Array.isArray(actorOptionsRaw)) {
    actorSelectOptions = actorOptionsRaw.map((a: any) => ({ label: a.name, value: a.id }));
  }
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(movie?.thumbnailUrl || "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);
  const [thumbnailOptions, setThumbnailOptions] = useState<string[]>([]);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string>("");
  const [generatedVideoId, setGeneratedVideoId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  
  const { uploadFile, uploadProgress, isUploading } = useChunkedUpload();

  const form = useForm<z.infer<typeof MovieSchema>>({
    resolver: zodResolver(MovieSchema),
    defaultValues: {
      movieName: movie?.title,
      movieDescripton: movie?.description,
      movieActor: Array.isArray(movie?.actorIds) ? movie.actorIds : [],
      movieType: movie?.type,
      movieGenre: movie?.genre,
      movieDuration: movie?.duration,
      movieVideo: movie?.videoUrl,
      movieThumbnail: "",
    },
  });

  const generateVideoId = () => {
    // Using Math.random() for videoId is safe here because it's only for temporary client-side identification and not for security purposes.
    // Replaced deprecated substr with slice.
    return `video_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    // Math.random() is safe here because this is only for generating a random offset for thumbnail regeneration.
    // It does not affect any security, authentication, or sensitive logic.
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
      toast.success("Video uploaded successfully!");
      
      setTimeout(() => {
        generateThumbnails();
      }, 500);
    }
  };

  const cancelUpload = async () => {
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
        toast.error("Error during deletion!");
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      toast.error("Error deleting movie!");
    }
  };

  const resetUploadState = () => {
    setVideoFile(null);
    setVideoPreviewUrl("");
    setUploadedVideoPath("");
    setGeneratedVideoId("");
    setThumbnailOptions([]);
    setShowThumbnailSelector(false);
    
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

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const result = await deleteMovie(movie.id);
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        // Redirect nach erfolgreichem Löschen
        setTimeout(() => {
          router.push("/movies");
        }, 1000);
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      toast.error("Error deleting!");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof MovieSchema>) => {
    if (!thumbnailUrl) {
      toast.error("Please select a thumbnail!");
      return;
    }

    startTransition(() => {
      updateMovie(movie.id, values, thumbnailUrl).then((data) => {
        if (data?.error) {
          toast.error(data?.error);
        }

        if (data?.success) {
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
                    options={actorSelectOptions}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder={actorsLoading ? "Loading..." : "Select actors"}
                    disabled={isPending || actorsLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Type, Genre und Duration in einer Zeile */}
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
                        <SelectValue placeholder="Choose..." />
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
                        <SelectValue placeholder="Choose..." />
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormLabel className="text-white">Upload Video (optional)</FormLabel>
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
                  className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    videoFile 
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
                          Click to select a new video
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Current: {movie?.videoUrl || "No video"}
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
                    onClick={cancelUpload}
                    disabled={isPending || isUploading}
                    className="h-11 px-4 bg-zinc-700 hover:bg-zinc-600 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {isUploading && (
                <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
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

          {/* Thumbnail Auswahl */}
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
                  Generate new
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

          {/* Thumbnail Vorschau mit Abwählen-Button */}
          {thumbnailUrl && !showThumbnailSelector && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-white">Current Thumbnail</FormLabel>
                {videoPreviewUrl && (
                  <Button
                    type="button"
                    onClick={deselectThumbnail}
                    className="h-8 px-3 bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Deselect
                  </Button>
                )}
              </div>
              <Image
                src={thumbnailUrl}
                alt="movie thumbnail"
                width={1920}
                height={1080}
                className="rounded-xl border-2 border-green-500"
              />
            </div>
          )}

          {/* Manueller Thumbnail Upload */}
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
                        <span className="text-sm">Upload new thumbnail</span>
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
          {showDeleteConfirm && (
            <div className="p-4 border-2 border-red-500 rounded-lg bg-red-900/20 mt-4">
              <p className="text-white text-center mb-4">
                Do you really want to delete this movie? This action cannot be undone!
              </p>
              <div className="flex gap-2 px-32">
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  {isDeleting ? "Deleting..." : "Yes, delete"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 h-11 bg-zinc-700 hover:bg-zinc-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showDeleteConfirm && (
            <>
              <div className="px-32 mt-4">
                <Button type="submit" disabled={isPending} variant="save" size="lg" className="w-full">
                  Save
                </Button>
              </div>
              <div className="px-32 mt-2">
                <Button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending || isDeleting}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>
      </form>
    </Form>
  );
};