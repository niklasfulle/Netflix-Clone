import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useNewMovieList = () => {
  const { data, error, isLoading } = useSWR('/api/movies/new', fetcher, {
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
export default useNewMovieList;