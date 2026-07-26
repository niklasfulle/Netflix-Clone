"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { addMovie } from "@/actions/add/add-movie";
import { MovieFormFields } from "@/components/MovieFormFields";
import { ThumbnailPreview } from "@/components/ThumbnailPreview";
import { ThumbnailSelector } from "@/components/ThumbnailSelector";
import { VideoUploadField } from "@/components/VideoUploadField";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useVideoThumbnailUpload } from "@/hooks/useVideoThumbnailUpload";
import { MovieSchema } from "@/schemas";

export const AddMovieForm = () => {
  const [isPending, startTransition] = useTransition();
  const [estimatedTime, setEstimatedTime] = useState("");
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
    generatedVideoId,
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
        const response = await fetch("/api/actors/all");
        const data = await response.json();
        setAllActors(
          Array.isArray(data.actors)
            ? data.actors.map((actor: { id: string; name: string }) => ({
                id: actor.id,
                name: actor.name,
              }))
            : [],
        );
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
    if (videoFile && uploadProgress > 0 && uploadProgress < 100 && uploadStartTimeRef.current) {
      const elapsedSeconds = (Date.now() - uploadStartTimeRef.current) / 1000;
      const totalSeconds = elapsedSeconds / (uploadProgress / 100);
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = Math.round(remainingSeconds % 60);
      const minutesLabel = minutes > 0 ? `${minutes}m ` : "";
      setEstimatedTime(`${minutesLabel}${seconds}s`);
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

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await baseHandleVideoUpload(event, (duration) => {
      form.setValue("movieDuration", duration);
    });
  };

  const uploadVideo = async () => {
    await baseUploadVideo(form.getValues("movieType"), (result) => {
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
        if (data && "error" in data && data.error) {
          form.reset();
          toast.error(data.error);
        } else if (data && "success" in data && data.success) {
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

  const actorOptions = allActors.map((actor) => ({
    label: actor.name,
    value: actor.id,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col gap-4">
          <MovieFormFields
            form={form}
            actorOptions={actorOptions}
            actorsLoading={actorsLoading}
            disabled={isPending}
            durationReadOnly
          />

          <VideoUploadField
            videoFile={videoFile}
            generatedVideoId={generatedVideoId}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            uploadedVideoPath={uploadedVideoPath}
            isPending={isPending}
            onVideoChange={handleVideoUpload}
            onUpload={uploadVideo}
            onCancel={handleCancelUpload}
            estimatedTime={estimatedTime}
            uploadDisabled={!form.getValues("movieType")}
            isUploaded={Boolean(videoPreviewUrl)}
          />

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
            <ThumbnailPreview thumbnailUrl="" onManualUpload={createDataUri} />
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

          <div className="mt-4 flex justify-end border-t border-zinc-800 pt-6">
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="w-full bg-red-600 font-semibold text-white hover:bg-red-500 sm:w-auto"
            >
              {isPending ? "Saving content..." : "Save Content"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
