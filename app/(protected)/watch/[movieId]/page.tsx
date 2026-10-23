"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import useMovie from '@/hooks/movies/useMovie';
import { useLanguage } from '@/components/providers/LanguageProvider';
import VideoPlayer from '@/components/player/VideoPlayer';
import WatchState from '@/components/player/WatchState';

export default function Watch() {
  const movieId = useParams<{ movieId: string }>().movieId;
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useLanguage();
  const { data, isLoading } = useMovie(movieId);
  const from = search.get('from');
  const back = () => router.push(from?.startsWith('/') && !from.startsWith('//') ? from : '/');
  const start = search.get('start');
  const seconds = start === null ? undefined : Number(start);
  let startTime: number | undefined;
  if (seconds !== undefined) startTime = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;

  if (!data) return <WatchState loading={isLoading} message={t('The movie or series could not be found.')} onBack={back} />;
  return <VideoPlayer key={movieId} items={[{ ...data, id: movieId, title: data.title || t('Now playing') }]} startTime={startTime} onBack={back} />;
}
