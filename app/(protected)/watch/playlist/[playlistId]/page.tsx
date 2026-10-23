"use client";

import { useParams, useRouter } from 'next/navigation';
import usePlaylist from '@/hooks/playlists/usePlaylist';
import { useLanguage } from '@/components/providers/LanguageProvider';
import VideoPlayer from '@/components/player/VideoPlayer';
import WatchState from '@/components/player/WatchState';

export default function WatchPlaylist() {
  const playlistId = useParams<{ playlistId: string }>().playlistId;
  const router = useRouter();
  const { t } = useLanguage();
  const { data: playlist, isLoading } = usePlaylist(playlistId);
  const back = () => router.push('/playlists');
  if (!playlist) return <WatchState loading={isLoading} message={t('Playlist not found')} onBack={back} />;
  const items = (playlist.movies ?? []).flatMap(movie => movie?.id ? [{ ...movie, id: movie.id, title: movie.title || t('Now playing') }] : []);
  if (!items.length) return <WatchState message={t('This playlist is empty.')} onBack={back} />;
  return <VideoPlayer key={playlistId} items={items} playlistTitle={playlist.kind === 'favorites' ? t('Favorites') : playlist.title || t('Playlist')} onBack={back} />;
}
