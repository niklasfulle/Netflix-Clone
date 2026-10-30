"use client";

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import VideoPlayer from '@/components/player/VideoPlayer';
import WatchState from '@/components/player/WatchState';
import useRandom from '@/hooks/useRandom';

export default function RandomPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: movie, isLoading } = useRandom();
  const back = () => router.push('/');

  if (!movie?.id) return <WatchState loading={isLoading} message={t('The movie or series could not be found.')} onBack={back} />;
  return <VideoPlayer key={movie.id} items={[{ ...movie, id: movie.id, title: movie.title || t('Now playing') }]} onBack={back} />;
}
