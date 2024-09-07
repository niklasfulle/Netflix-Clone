import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useNewMovieList2 = () => {
  const { data, error, isLoading } = useSWR('/api/movies/newMovies', fetcher, {
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
export default useNewMovieList2;