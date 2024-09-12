import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useSeriesByActor = (actor: string) => {
  const { data, error, isLoading } = useSWR(`/api/series/moviesByActor?actor=${actor}`, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return {
    data,
    error,
    isLoading
  }
};
export default useSeriesByActor;