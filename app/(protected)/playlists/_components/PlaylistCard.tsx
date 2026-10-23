"use client";

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Play, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { removePlaylist } from '@/actions/playlist/remove-playlist';
import type { PlaylistDto } from '@/lib/api-types';
import PlaylistCover from './PlaylistCover';
import FavoritesPlaylistCard from './FavoritesPlaylistCard';

interface PlaylistCardProps {
  data: PlaylistDto;
  isLoading: boolean;
  openModalEdit: (playlistId: string) => void;
}

export default function PlaylistCard({ data, isLoading, openModalEdit }: Readonly<PlaylistCardProps>) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { t, message } = useLanguage();
  const movies = data.movies ?? [];
  const playlistId = data.id;
  const canPlay = movies.length > 0 && !isLoading && Boolean(playlistId);

  const onClickDelete = async () => {
    if (!playlistId) return;
    setDeleteOpen(false);
    try {
      const result = await removePlaylist(playlistId);
      if (result?.error) toast.error(result.error);
      if (result?.success) {
        toast.success(result.success);
        location.reload();
      }
    } catch {
      toast.error(t('Something went wrong!'));
    }
  };

  if (data.kind === 'favorites') {
    return <FavoritesPlaylistCard data={data} isLoading={isLoading} />;
  }

  return (
    <article aria-label={data.title} aria-busy={isLoading} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
      <PlaylistCover movies={movies} />
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <h2 className="break-words font-semibold text-white">{data.title}</h2>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">{message('playlistTitleCount', { count: movies.length })}</p>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" aria-label={`${t('Edit')}: ${data.title}`} disabled={isLoading || !playlistId}
              onClick={() => { if (playlistId) openModalEdit(playlistId); }}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
              <PopoverTrigger asChild>
                <button type="button" aria-label={`${t('Delete')}: ${data.title}`} disabled={isLoading || !playlistId}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="flex w-56 flex-col items-center gap-2">
                <span className="text-center text-sm">{t('Really delete playlist?')}</span>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="min-h-11 rounded bg-red-600 px-3 text-white hover:bg-red-700" onClick={onClickDelete}>{t('Yes')}</button>
                  <button type="button" className="min-h-11 rounded bg-zinc-700 px-3 text-white hover:bg-zinc-600" onClick={() => setDeleteOpen(false)}>{t('No')}</button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {canPlay ? (
          <Link href={`/watch/playlist/${playlistId}`} className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-center text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
            <Play className="h-4 w-4 shrink-0" aria-hidden="true" />{t('Play')}
          </Link>
        ) : (
          <p className="mt-auto text-xs leading-5 text-zinc-400">{!isLoading && t('This playlist is empty.')}</p>
        )}
      </div>
    </article>
  );
}
