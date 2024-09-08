import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useGetActors = () => {
  const { data, error, isLoading } = useSWR('/api/movies/getActors', fetcher, {
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
export default useGetActors;