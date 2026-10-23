"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import VideoPlayer from '@/components/player/VideoPlayer';
import WatchState from '@/components/player/WatchState';
import { compactPlaylistMovies, RANDOM_PLAYLIST_STORAGE_KEY, type RandomPlaylist } from '@/lib/random-playlist';

export default function RandomWatch() {
  const router = useRouter();
  const { t } = useLanguage();
  const [playlist, setPlaylist] = useState<RandomPlaylist | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RANDOM_PLAYLIST_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.title !== 'string' || !Array.isArray(data.movies)) throw new Error('Invalid temporary playlist');
        const movies = compactPlaylistMovies(data.movies.filter((movie: unknown) => movie && typeof movie === 'object'));
        const returnPath = typeof data.returnPath === 'string' && data.returnPath.startsWith('/') && !data.returnPath.startsWith('//') ? data.returnPath : '/';
        setPlaylist({ title: data.title, movies, returnPath });
      }
    } catch {
      try { sessionStorage.removeItem(RANDOM_PLAYLIST_STORAGE_KEY); } catch { /* Storage can be unavailable. */ }
    } finally {
      setLoaded(true);
    }
  }, []);

  const back = () => router.push(playlist?.returnPath || '/');
  if (!loaded) return <WatchState loading onBack={back} />;
  if (!playlist?.movies.length) return <WatchState message={t('Playlist not found')} onBack={back} />;
  return <VideoPlayer items={playlist.movies} playlistTitle={`${t('Random')} · ${playlist.title}`} onBack={back} />;
}
