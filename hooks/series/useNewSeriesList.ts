import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useNewSeriesList = () => {
  const { data, error, isLoading } = useSWR('/api/series/newSeries', fetcher, {
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
export default useNewSeriesList;