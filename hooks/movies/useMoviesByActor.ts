import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useMoviesByActor = (actor: string) => {
  const { data, error, isLoading } = useSWR(actor ? `/api/movies/moviesByActor/${actor}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  return {
    data,
    error,
    isLoading
  }
};
export default useMoviesByActor;