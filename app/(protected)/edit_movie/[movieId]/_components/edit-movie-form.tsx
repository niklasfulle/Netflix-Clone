"use client";
import Image from "next/image";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";

import { updateMovie } from "@/actions/add/update-movie";
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
import { MovieSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";

let thumbnailUrl = "";
const createDataUri = (e: any) => {
  const file = e.target.files[0];

  const reader = new FileReader();
  reader.onloadend = () => {
    const movieThumbnailData = document.getElementById(
      "movieThumbnailData"
    )! as HTMLInputElement;
    thumbnailUrl = reader.result as string;
    movieThumbnailData.value = reader.result as string;
    const movieThumbnail = document.getElementById("movieThumbnail")!;
    movieThumbnail.innerHTML = "";

    const img = document.createElement("img");
    img.src = reader.result as string;
    img.style.width = "100%";
    img.style.marginTop = "0.75rem";
    img.style.borderRadius = "0.5rem";
    movieThumbnail.append(img);
  };
  reader.readAsDataURL(file);
};

interface EditMovieFormProps {
  movie: Record<string, any>;
}

export const EditMovieForm = ({ movie }: EditMovieFormProps) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof MovieSchema>>({
    resolver: zodResolver(MovieSchema),
    defaultValues: {
      movieName: movie?.title,
      movieDescripton: movie?.description,
      movieActor: movie?.actor,
      movieType: movie?.type,
      movieGenre: movie?.genre,
      movieDuration: movie?.duration,
      movieVideo: movie?.videoUrl,
      movieThumbnail: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof MovieSchema>) => {
    startTransition(() => {
      console.log(values);
      updateMovie(movie.id, values, thumbnailUrl).then((data) => {
        if (data?.error) {
          form.reset();
          toast.error(data?.error);
        }

        if (data?.success) {
          form.reset();
          toast.success(data?.success);
        }
      });
    });
  };

  thumbnailUrl = movie?.thumbnailUrl;

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
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="movieActor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Actor</FormLabel>
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
              name="movieType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Type</FormLabel>
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
              name="movieGenre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Genre</FormLabel>
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
          <FormField
            control={form.control}
            name="movieVideo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Video Link</FormLabel>
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
            name="movieThumbnail"
            render={() => (
              <FormItem>
                <FormLabel className="text-white">Thumbnail</FormLabel>
                <FormControl>
                  <input
                    className="w-full p-1.5 text-sm text-white border border-gray-500 rounded-lg cursor-pointer bg-zinc-800 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    id="multiple_files"
                    type="file"
                    multiple
                    onChange={(e: any) => createDataUri(e)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div id="movieThumbnail">
            <Image
              src={thumbnailUrl}
              alt="movie thumbnail"
              width={1920}
              height={1080}
              className="rounded-xl mt-3"
            />
          </div>
          <div className="hidden">
            <FormField
              control={form.control}
              name="movieThumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Thumbnail Link</FormLabel>
                  <FormControl>
                    <Input
                      className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                      {...field}
                      disabled={isPending}
                      placeholder=""
                      type="text"
                      id="movieThumbnailData"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="px-32">
            <Button type="submit" disabled={isPending} variant="auth" size="lg">
              Save
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
