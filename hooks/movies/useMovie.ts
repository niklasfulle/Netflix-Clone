import fetcher from '@/lib/fetcher';
import useSWR from 'swr';

const useMovie = (id?: string) => {
  const { data, error, isLoading } = useSWR(id ? `/api/movies/${id}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  console.log(data)

  return {
    data,
    error,
    isLoading,
  }
};
export default useMovie;