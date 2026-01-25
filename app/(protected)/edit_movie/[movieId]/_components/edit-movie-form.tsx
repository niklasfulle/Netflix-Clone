"use client";
import { useTransition, useState, useEffect } from "react";
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
import { useVideoThumbnailUpload } from "@/hooks/useVideoThumbnailUpload";
import { ThumbnailSelector } from "@/components/ThumbnailSelector";
import { ThumbnailPreview } from "@/components/ThumbnailPreview";
import { Trash2, Upload, X, Check } from "lucide-react";

// Lese die Optionen aus den ENV-Variablen
const TYPE_OPTIONS = process.env.NEXT_PUBLIC_TYPE?.split(",") || ["Movie", "Serie"];
const GENRE_OPTIONS = process.env.NEXT_PUBLIC_GENRE?.split(",") || ["Action", "Comedy", "Drama"];

interface EditMovieFormProps {
  movie: Record<string, any>;
}

export const EditMovieForm = ({ movie }: EditMovieFormProps) => {
  const router = useRouter();
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

  const {
    videoFile,
    videoPreviewUrl,
    thumbnailUrl,
    showThumbnailSelector,
    thumbnailOptions,
    uploadProgress,
    isUploading,
    uploadedVideoPath,
    videoRef,
    canvasRef,
    handleVideoUpload: baseHandleVideoUpload,
    uploadVideo: baseUploadVideo,
    createDataUri,
    cancelUpload,
    regenerateThumbnails,
    selectThumbnail,
    deselectThumbnail,
    setThumbnailUrl,
  } = useVideoThumbnailUpload();

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

  // Set initial thumbnail from movie
  const [initialThumbnail] = useState(movie?.thumbnailUrl || "");

  // Initialize thumbnail after component mounts
  useEffect(() => {
    if (initialThumbnail) {
      setThumbnailUrl(initialThumbnail);
    }
  }, [initialThumbnail, setThumbnailUrl]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await baseHandleVideoUpload(e, (duration) => {
      form.setValue("movieDuration", duration);
    });
  };

  const uploadVideo = async () => {
    const videoType = form.getValues("movieType");
    await baseUploadVideo(videoType, (result) => {
      form.setValue("movieVideo", result.videoId);
    });
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
        if (data && 'error' in data && data.error) {
          toast.error(data.error);
        } else if (data && 'success' in data && data.success) {
          toast.success(data.success);
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
                    disabled={isUploading || !!uploadedVideoPath || !form.getValues("movieType")}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
                  >
                    {(() => {
                      if (isUploading) {
                        return <><Upload className="w-4 h-4 mr-2 animate-pulse" />Uploading... {uploadProgress}%</>;
                      }
                      if (videoPreviewUrl) {
                        return <><Check className="w-4 h-4 mr-2" />Uploaded</>;
                      }
                      return <><Upload className="w-4 h-4 mr-2" />Upload Video</>;
                    })()}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => cancelUpload()}
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
                <track kind="captions" />
              </video>
              <canvas ref={canvasRef} />
            </div>
          )}

          {showThumbnailSelector && thumbnailOptions.length > 0 && (
            <ThumbnailSelector
              thumbnailOptions={thumbnailOptions}
              onSelectThumbnail={selectThumbnail}
              onRegenerate={regenerateThumbnails}
            />
          )}

          {thumbnailUrl && !showThumbnailSelector && (
            <ThumbnailPreview
              thumbnailUrl={thumbnailUrl}
              onDeselect={deselectThumbnail}
              onManualUpload={createDataUri}
              showDeselect={!!videoPreviewUrl}
              useImage={false}
            />
          )}

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