"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteMovie } from "@/actions/add/delete-movie";
import { updateMovie } from "@/actions/add/update-movie";
import { MovieFormFields } from "@/components/MovieFormFields";
import { ThumbnailPreview } from "@/components/ThumbnailPreview";
import { ThumbnailSelector } from "@/components/ThumbnailSelector";
import { VideoUploadField } from "@/components/VideoUploadField";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useActorsAll from "@/hooks/useActorsAll";
import { useVideoThumbnailUpload } from "@/hooks/useVideoThumbnailUpload";
import { MovieSchema } from "@/schemas";

interface EditMovieFormProps {
  movie: Record<string, any>;
}

export const EditMovieForm = ({ movie }: EditMovieFormProps) => {
  const router = useRouter();
  const { actors: actorOptionsRaw, isLoading: actorsLoading } = useActorsAll();
  let actorSelectOptions: { label: string; value: string }[] = [];
  if (Array.isArray(actorOptionsRaw?.actors)) {
    actorSelectOptions = actorOptionsRaw.actors.map((actor: any) => ({
      label: actor.name,
      value: actor.id,
    }));
  } else if (Array.isArray(actorOptionsRaw)) {
    actorSelectOptions = actorOptionsRaw.map((actor: any) => ({
      label: actor.name,
      value: actor.id,
    }));
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

  const [initialThumbnail] = useState(movie?.thumbnailUrl || "");

  useEffect(() => {
    if (initialThumbnail) {
      setThumbnailUrl(initialThumbnail);
    }
  }, [initialThumbnail, setThumbnailUrl]);

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

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteMovie(movie.id);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
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
        if (data && "error" in data && data.error) {
          toast.error(data.error);
        } else if (data && "success" in data && data.success) {
          toast.success(data.success);
        }
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col gap-2 mx-4">
          <MovieFormFields
            form={form}
            actorOptions={actorSelectOptions}
            actorsLoading={actorsLoading}
            disabled={isPending}
            selectPlaceholder="Choose..."
          />

          <VideoUploadField
            videoFile={videoFile}
            generatedVideoId={generatedVideoId}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            uploadedVideoPath={uploadedVideoPath}
            isPending={isPending}
            currentVideoUrl={movie?.videoUrl}
            isOptional
            onVideoChange={handleVideoUpload}
            onUpload={uploadVideo}
            onCancel={() => void cancelUpload()}
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
              showDeselect={Boolean(videoPreviewUrl)}
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

          {!showDeleteConfirm && (
            <>
              <div className="px-32 mt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  variant="save"
                  size="lg"
                  className="w-full"
                >
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
