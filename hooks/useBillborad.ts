import { useMemo } from 'react';
import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';

const useBillboard = () => {
  const uniqueKey = useMemo(() => `/api/random?context=billboard&t=${Date.now()}`, []);
  
  const { data, error, isLoading } = useSWR<CatalogItemDto | null>(uniqueKey, fetcher, {
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
