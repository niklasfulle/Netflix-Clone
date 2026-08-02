import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { PlaylistDto } from '@/lib/api-types';

const usePlaylist = (id?: string) => {
  const { data, error, isLoading } = useSWR<PlaylistDto>(id ? `/api/playlist/${id}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return {
    data,
    error,
    isLoading,
  }
};
export default usePlaylist;
