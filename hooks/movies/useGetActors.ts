import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useGetActors = (limit: number) => {
  const { data, error, isLoading } = useSWR(limit ? `/api/movies/getActors/${limit}` : null, fetcher, {
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