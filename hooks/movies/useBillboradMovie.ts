import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useBillboradMovie = () => {
  const { data, error, isLoading } = useSWR("/api/random/movies", fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    data,
    error,
    isLoading,
  }
}

export default useBillboradMovie