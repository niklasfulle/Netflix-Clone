import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const usePlaylist = (id?: string) => {
  const { data, error, isLoading } = useSWR(id ? `/api/playlist/${id}` : null, fetcher, {
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
