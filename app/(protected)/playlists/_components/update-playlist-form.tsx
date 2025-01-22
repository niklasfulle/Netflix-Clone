"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MovieSchema, PlaylistSchema } from "@/schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useTransition } from "react";
import { updatePlaylist } from "@/actions/playlist/update-playlist";
import toast from "react-hot-toast";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaTrashAlt,
} from "react-icons/fa";
import Image from "next/image";
import { difference, swapElements } from "@/lib/utils";
import PlaylistEntryCard from "./PlaylistEntryCard";

interface PlaylistCardProps {
  playlist: Record<string, any>;
}

export const UpdatePlaylistForm = ({ playlist }: PlaylistCardProps) => {
  const [isPending, startTransition] = useTransition();
  const [movies, setMovies] = useState<any>([]);
  const [movieRemoved, setMovieRemoved] = useState<boolean>(false);
  const [movieMoved, setMovieMoved] = useState<boolean>(false);

  const form = useForm<z.infer<typeof PlaylistSchema>>({
    resolver: zodResolver(PlaylistSchema),
    defaultValues: {
      playlistId: playlist?.id,
      playlistName: playlist?.title,
    },
  });

  const onSubmit = (values: z.infer<typeof PlaylistSchema>) => {
    let moviesToRemove = [];
    if (movieRemoved) {
      moviesToRemove = difference(playlist.movies, movies);
    }

    startTransition(() => {
      updatePlaylist(values, moviesToRemove, movies).then((data) => {
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

  const onMove = (dir: string, index: number) => {
    if (!movieRemoved && !movieMoved) {
      if (dir == "up") {
        if (index == 0) {
          setMovies([
            ...swapElements(playlist.movies, 0, playlist.movies.length - 1),
          ]);
        } else {
          setMovies([...swapElements(playlist.movies, index, index - 1)]);
        }
        setMovieMoved(true);
      } else if (dir == "down") {
        if (index == playlist.movies.length - 1) {
          setMovies([
            ...swapElements(playlist.movies, playlist.movies.length - 1, 0),
          ]);
        } else {
          setMovies([...swapElements(playlist.movies, index, index + 1)]);
        }
        setMovieMoved(true);
      }
    } else {
      if (dir == "up") {
        if (index == 0) {
          setMovies([...swapElements(movies, 0, movies.length - 1)]);
        } else {
          setMovies([...swapElements(movies, index, index - 1)]);
        }
      } else if (dir == "down") {
        if (index == movies.length - 1) {
          setMovies([...swapElements(movies, movies.length - 1, 0)]);
        } else {
          setMovies([...swapElements(movies, index, index + 1)]);
        }
      }
    }
  };

  const onClickDelete = (movieId: string) => {
    if (!movieRemoved && !movieMoved && playlist.movies.length == 1) {
      let filterMovies = playlist.movies.filter(
        (movie: any) => movie.id != movieId
      );

      setMovies(filterMovies);
      setMovieRemoved(!movieRemoved);
    } else if (!movieRemoved && !movieMoved && playlist.movies.length > 1) {
      let filterMovies = playlist.movies.filter(
        (movie: any) => movie.id != movieId
      );

      setMovies(filterMovies);
      setMovieRemoved(!movieRemoved);
    } else if (movieRemoved || movieMoved) {
      if (movies.length > 1) {
        setMovies(movies.filter((movie: any) => movie.id != movieId));
      } else {
        setMovies([]);
      }
    }
  };

  if (playlist == undefined) {
    return null;
  }

  if (form.getValues("playlistName") == undefined) {
    form.setValue("playlistName", playlist?.title);
    form.setValue("playlistId", playlist?.id);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col gap-2 mx-4 mt-8">
          <FormField
            control={form.control}
            name="playlistName"
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
          <div className="max-w-96">
            <label className="text-white pb-2">Movies</label>
            <div className="grid grid-cols-2 gap-1 p-2 mt-2 rounded-md bg-zinc-800 max-h-[20rem] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:bg-neutral-500">
              {!movieRemoved &&
                !movieMoved &&
                movies.length == 0 &&
                playlist.movies.map((movie: any, index: number) => (
                  <PlaylistEntryCard
                    key={movie.id}
                    index={index}
                    size={playlist.movies.length}
                    movie={movie}
                    onMove={onMove}
                    onClickDelete={onClickDelete}
                  />
                ))}
              {movies.length != 0 &&
                movies.map((movie: any, index: number) => (
                  <PlaylistEntryCard
                    key={movie.id}
                    index={index}
                    size={movies.length}
                    movie={movie}
                    onMove={onMove}
                    onClickDelete={onClickDelete}
                  />
                ))}

              {movieRemoved && movies.length == 0 && (
                <div className="w-full text-center col-span-2 text-white">
                  No Movies
                </div>
              )}
            </div>
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
