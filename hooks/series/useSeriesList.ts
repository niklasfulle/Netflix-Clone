import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useSeriesList = () => {
  const { data, error, isLoading } = useSWR('/api/series', fetcher, {
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
export default useSeriesList;