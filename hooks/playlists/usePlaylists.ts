import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { PlaylistDto } from '@/lib/api-types';

const usePlaylists = () => {
  const { data, error, isLoading, mutate } = useSWR<PlaylistDto[]>("/api/playlist", fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return {
    data,
    error,
    isLoading,
    mutate,
  }
};
export default usePlaylists;
