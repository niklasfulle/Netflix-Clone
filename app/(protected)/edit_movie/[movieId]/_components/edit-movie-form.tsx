"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Save, Trash2, TriangleAlert, X } from "lucide-react";

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

export interface EditableMovie {
  id: string;
  title: string;
  description: string;
  type: string;
  genre: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  actorIds?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt?: string;
}

interface EditMovieFormProps {
  movie: EditableMovie;
  navigateAfterDelete?: (path: string) => void;
}

const replaceBrowserLocation = (path: string) => window.location.replace(path);

export const EditMovieForm = ({
  movie,
  navigateAfterDelete = replaceBrowserLocation,
}: EditMovieFormProps) => {
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
        return;
      }

      if (result.success) {
        navigateAfterDelete("/admin/movies");
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
          router.refresh();
        }
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col gap-4">
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

          {showDeleteConfirm && (
            <section
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-5"
              aria-labelledby="delete-content-title"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-red-500/15 p-2 text-red-300">
                  <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 id="delete-content-title" className="font-semibold text-white">
                    Inhalt endgültig löschen?
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-red-100/70">
                    Der Film und seine Verknüpfungen werden dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="h-11 bg-red-600 font-semibold text-white hover:bg-red-500 sm:min-w-36"
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isDeleting ? "Wird gelöscht..." : "Jetzt löschen"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="h-11 border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 sm:min-w-32"
                >
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  Abbrechen
                </Button>
              </div>
            </section>
          )}

          {!showDeleteConfirm && (
            <div className="mt-4 flex flex-col-reverse gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending || isDeleting}
                className="h-11 border border-red-500/30 bg-transparent font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Inhalt löschen
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                size="lg"
                className="h-11 bg-red-600 font-semibold text-white hover:bg-red-500 sm:min-w-48"
              >
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                {isPending ? "Änderungen werden gespeichert..." : "Änderungen speichern"}
              </Button>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
};
