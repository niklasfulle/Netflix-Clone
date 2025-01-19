"use client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlaylistSelectSchema } from "@/schemas";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { addPlaylistEntry } from "@/actions/playlist/add-playlist-entry";

interface PlaylistSelectProps {
  playlists: any[];
  movieId: string;
}

const PlaylistSelect: React.FC<PlaylistSelectProps> = ({
  playlists,
  movieId,
}) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const form = useForm<z.infer<typeof PlaylistSelectSchema>>({
    resolver: zodResolver(PlaylistSelectSchema),
    defaultValues: {
      playlistId: "",
      movieId: movieId,
    },
  });

  const onSubmit = (valuse: z.infer<typeof PlaylistSelectSchema>) => {
    startTransition(() => {
      addPlaylistEntry(valuse)
        .then((data) => {
          if (data?.error) {
            setError(data?.error);
          }

          if (data?.success) {
            setSuccess(data?.success);
            setError(undefined);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };
  return (
    <div className="w-full px-12">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-row items-center justify-between gap-4 w-full">
            <FormField
              control={form.control}
              name="playlistId"
              render={({ field }) => (
                <FormItem>
                  <Select
                    disabled={isPending}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 border-gray-500 px-4 w-64 md:w-72 lg:w-96">
                      <SelectTrigger>
                        <SelectValue placeholder="Select Playlist" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={isPending}
              variant="auth"
              size="lg"
              className="max-w-24 mb-6"
            >
              Add
            </Button>
          </div>
          <div className="pb-4 px-12 w-full flex flex-row justify-center">
            <FormError message={error} />
            <FormSuccess message={success} />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PlaylistSelect;
