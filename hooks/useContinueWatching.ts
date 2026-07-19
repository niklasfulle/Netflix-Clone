import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useContinueWatching = () => {
  const { data, error, isLoading } = useSWR(
    '/api/continue-watching',
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return { data, error, isLoading };
};

export default useContinueWatching;
