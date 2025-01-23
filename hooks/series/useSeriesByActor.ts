import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useSeriesByActor = (actor: string) => {
  const { data, error, isLoading } = useSWR(actor ? `/api/series/seriesByActor/${actor}` : null, fetcher, {
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
export default useSeriesByActor;