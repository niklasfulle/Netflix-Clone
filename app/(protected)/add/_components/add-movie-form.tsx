"use client";
import { useTransition, useState, useEffect, useRef } from "react";
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
import { useVideoThumbnailUpload } from "@/hooks/useVideoThumbnailUpload";
import { ThumbnailSelector } from "@/components/ThumbnailSelector";
import { ThumbnailPreview } from "@/components/ThumbnailPreview";
import { Upload, X, Check } from "lucide-react";

// Lese die Optionen aus den ENV-Variablen
const TYPE_OPTIONS = process.env.NEXT_PUBLIC_TYPE?.split(",") || ["Movie", "Serie"];
const GENRE_OPTIONS = process.env.NEXT_PUBLIC_GENRE?.split(",") || ["Action", "Comedy", "Drama"];

export const AddMovieForm = () => {
  const [isPending, startTransition] = useTransition();
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const uploadStartTimeRef = useRef<number | null>(null);

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
    resetUploadState,
    setThumbnailUrl,
  } = useVideoThumbnailUpload();

  const [allActors, setAllActors] = useState<{ id: string; name: string }[]>([]);
  const [actorsLoading, setActorsLoading] = useState(true);

  useEffect(() => {
    const fetchActors = async () => {
      setActorsLoading(true);
      try {
        const res = await fetch("/api/actors/all");
        const data = await res.json();
        setAllActors(Array.isArray(data.actors) ? data.actors.map((a: any) => ({ id: a.id, name: a.name })) : []);
      } catch {
        setAllActors([]);
      }
      setActorsLoading(false);
    };
    fetchActors();
  }, []);

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

  const handleCancelUpload = async () => {
    await cancelUpload(() => {
      form.setValue("movieVideo", "");
      form.setValue("movieDuration", "");
    });
  };

  const onSubmit = async (values: z.infer<typeof MovieSchema>) => {
    if (!thumbnailUrl) {
      toast.error("Please select a thumbnail!");
      return;
    }

    startTransition(() => {
      addMovie(values, thumbnailUrl).then((data) => {
        if (data && 'error' in data && data.error) {
          form.reset();
          toast.error(data.error);
        } else if (data && 'success' in data && data.success) {
          form.reset();
          form.setValue("movieActor", []);
          form.setValue("movieType", "");
          form.setValue("movieGenre", "");
          setThumbnailUrl("");
          resetUploadState();
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
              showDeselect
              useImage
            />
          )}

          {!thumbnailUrl && (
            <ThumbnailPreview
              thumbnailUrl=""
              onManualUpload={createDataUri}
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