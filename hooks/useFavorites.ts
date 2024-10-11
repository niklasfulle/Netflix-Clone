import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useFavorites = (id?: string) => {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/favorites/${id}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  return {
    data,
    error,
    isLoading,
    mutate
  }
};
export default useFavorites;