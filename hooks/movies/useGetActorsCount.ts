import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useGetActorsCount = () => {
  const { data, error, isLoading } = useSWR('/api/movies/getActorsCount', fetcher, {
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
export default useGetActorsCount;