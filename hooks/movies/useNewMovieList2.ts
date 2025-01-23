import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useNewMovieList2 = () => {
  const { data, error, isLoading } = useSWR('/api/movies/newMovies', fetcher, {
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
export default useNewMovieList2;