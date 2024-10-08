import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useGetActors = (limit: number) => {
  const { data, error, isLoading } = useSWR('/api/movies/getActors?limit=' + limit, fetcher, {
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