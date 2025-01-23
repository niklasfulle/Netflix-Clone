"use client";
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as z from 'zod';

import { addPlaylist } from '@/actions/playlist/add-playlist';
import { Button } from '@/components/ui/button';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlaylistSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

export const AddPlaylistForm = () => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof PlaylistSchema>>({
    resolver: zodResolver(PlaylistSchema),
    defaultValues: {
      playlistName: "",
    },
  });

  const onSubmit = (values: z.infer<typeof PlaylistSchema>) => {
    startTransition(() => {
      addPlaylist(values).then((data) => {
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
          <div className="px-32">
            <Button type="submit" disabled={isPending} variant="auth" size="lg">
              Add
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
