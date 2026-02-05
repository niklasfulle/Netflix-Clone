import { useState } from 'react';
import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useMovieList = () => {
  const [uniqueKey] = useState(() => `/api/movies/random?count=20&t=${Date.now()}`);
  
  const { data, error, isLoading } = useSWR(uniqueKey, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 0,
  });
  return {
    data,
    error,
    isLoading
  }
};
export default useMovieList;