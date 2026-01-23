"use client";
import { useTransition, useState } from 'react';
import usePlaylists from '@/hooks/playlists/usePlaylists';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import * as z from 'zod';

import { addPlaylistEntry } from '@/actions/playlist/add-playlist-entry';
import { addPlaylist } from '@/actions/playlist/add-playlist';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { PlaylistSelectSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

interface PlaylistSelectProps {
  playlists: any[];
  movieId: string;
}

const PlaylistSelect: React.FC<PlaylistSelectProps> = ({
  playlists,
  movieId,
}) => {
  const [isPending, startTransition] = useTransition();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [localPlaylists] = useState(playlists);
  const [selectValue, setSelectValue] = useState("");
  const { mutate } = usePlaylists() || {};

  const form = useForm<z.infer<typeof PlaylistSelectSchema>>({
    resolver: zodResolver(PlaylistSelectSchema),
    defaultValues: {
      playlistId: "",
      movieId: movieId,
    },
  });

  const onSubmit = async (values: z.infer<typeof PlaylistSelectSchema>) => {
    if (selectValue === "__new__") {
      if (!newPlaylistName.trim()) {
        toast.error("Bitte gib einen Namen für die neue Playlist ein.");
        return;
      }
      startTransition(async () => {
        const res = await addPlaylist({ playlistName: newPlaylistName });
        if (res?.success && res?.playlist?.id) {
          toast.success(res.success);
          setNewPlaylistName("");
          if (mutate) mutate();
          setSelectValue(res.playlist.id);
          form.setValue("playlistId", res.playlist.id);
          // Film direkt zur neuen Playlist hinzufügen
          const entryRes = await addPlaylistEntry({ playlistId: res.playlist.id, movieId });
          if (entryRes?.success) {
            toast.success(entryRes.success);
          } else if (entryRes?.error) {
            toast.error(entryRes.error);
          }
        } else if (res?.error) {
          toast.error(res.error);
        }
      });
    } else {
      startTransition(() => {
        addPlaylistEntry(values).then((data) => {
          if (data?.error) {
            toast.error(data?.error);
          }
          if (data?.success) {
            toast.success(data?.success);
          }
        });
      });
    }
  };
  return (
    <div className="w-full px-12">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col items-center w-full md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto">
            <div className="flex flex-col items-center gap-2 flex-1">
              <FormField
                control={form.control}
                name="playlistId"
                render={({ field }) => (
                  <FormItem className="w-full md:w-auto">
                    <Select
                      disabled={isPending}
                      onValueChange={val => {
                        field.onChange(val);
                        setSelectValue(val);
                      }}
                      value={selectValue}
                      defaultValue={field.value}
                    >
                      <FormControl className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 border-gray-500 px-4 w-full md:w-72">
                        <SelectTrigger>
                          <SelectValue placeholder="Select Playlist" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {localPlaylists.map((playlist) => (
                          <SelectItem key={playlist.id} value={playlist.id}>
                            {playlist.title}
                          </SelectItem>
                        ))}
                        <SelectItem key="__new__" value="__new__">Neue Playlist</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectValue === "__new__" && (
                <input
                  type="text"
                  className="text-white bg-zinc-800 h-10 border border-gray-500 px-4 rounded w-full md:w-56 lg:w-72 focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Name der neuen Playlist..."
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  disabled={isPending}
                  style={{ minWidth: '180px' }}
                />
              )}
            </div>
            <Button
              disabled={isPending || (selectValue !== "__new__" && !form.watch('playlistId')) || (selectValue === "__new__" && !newPlaylistName.trim())}
              variant="auth"
              size="lg"
              className="min-w-[170px] h-10 font-semibold text-base bg-red-700 hover:bg-red-800 transition-colors"
              type="submit"
            >
              {selectValue === "__new__" ? "Add to new Playlist" : "Add"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PlaylistSelect;
