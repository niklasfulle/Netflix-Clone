import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const usePlaylists = () => {
  const { data, error, isLoading, mutate } = useSWR("/api/playlist", fetcher, {
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