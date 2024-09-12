import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const useSeriesList = () => {
  const { data, error, isLoading } = useSWR('/api/series', fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  return {
    data,
    error,
    isLoading
  }
};
export default useSeriesList;