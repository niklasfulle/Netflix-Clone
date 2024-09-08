import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useMoviesByActor = (actor: string) => {
  const { data, error, isLoading } = useSWR(`/api/movies/moviesByActor?actor=${actor}`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return {
    data,
    error,
    isLoading
  }
};
export default useMoviesByActor;