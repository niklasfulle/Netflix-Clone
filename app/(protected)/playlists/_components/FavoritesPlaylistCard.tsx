"use client";

import Link from 'next/link';
import { Heart, Play } from 'lucide-react';

import { useLanguage } from '@/components/providers/LanguageProvider';
import type { PlaylistDto } from '@/lib/api-types';
import { FAVORITES_PLAYLIST_ID } from '@/lib/playlists';
import PlaylistCover from './PlaylistCover';

export default function FavoritesPlaylistCard({ data, isLoading }: Readonly<{ data: PlaylistDto; isLoading: boolean }>) {
  const { t, message } = useLanguage();
  const movies = data.movies ?? [];

  return (
    <article aria-label={t('Favorites')} aria-busy={isLoading} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-red-500/25 bg-zinc-900">
      <PlaylistCover movies={movies} emptyIcon={<Heart className="m-auto h-10 w-10 text-red-400" aria-hidden="true" />} />
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-white">{t('Favorites')}</h2>
          <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">{t('Automatic')}</span>
        </div>
        <p className="text-xs text-zinc-400">{message('playlistTitleCount', { count: movies.length })} · {t('Synced with your favorites.')}</p>
        {movies.length > 0 && !isLoading ? (
          <Link href={`/watch/playlist/${FAVORITES_PLAYLIST_ID}`} className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-center text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
            <Play className="h-4 w-4 shrink-0" aria-hidden="true" />{t('Play favorites')}
          </Link>
        ) : (
          <p className="text-xs leading-5 text-zinc-400">{t('Mark movies and series with the heart to add them here.')}</p>
        )}
      </div>
    </article>
  );
}
