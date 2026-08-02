import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';

const useContinueWatching = () => {
  const { data, error, isLoading } = useSWR<CatalogItemDto[]>(
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
