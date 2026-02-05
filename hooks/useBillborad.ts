import { useMemo } from 'react';
import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useBillboard = () => {
  const uniqueKey = useMemo(() => `/api/random?context=billboard&t=${Date.now()}`, []);
  
  const { data, error, isLoading } = useSWR(uniqueKey, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  return {
    data,
    error,
    isLoading,
  }
}

export default useBillboard