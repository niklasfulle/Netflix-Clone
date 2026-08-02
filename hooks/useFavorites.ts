import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';

const useFavorites = () => {
  const { data, error, isLoading, mutate } = useSWR<CatalogItemDto[]>('/api/favorites', fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  return {
    data,
    error,
    isLoading,
    mutate
  }
};
export default useFavorites;
