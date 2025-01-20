import fetcher from '@/lib/fetcher';
import useSWR from 'swr';

const usePlaylists = () => {
  const { data, error, isLoading } = useSWR("/api/playlist", fetcher, {
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
export default usePlaylists;