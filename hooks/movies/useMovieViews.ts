import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useMovieViews = (movieId?: string) => {
console.log("useMovieViews hook called with movieId:", movieId);
  const { data, error, isLoading } = useSWR(movieId ? `/api/movies/${movieId}/views` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  return {
    data,
    error,
    isLoading,
  };
};

export default useMovieViews;
