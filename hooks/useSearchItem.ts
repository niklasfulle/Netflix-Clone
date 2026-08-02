import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';

const useSearchItem = (item: string) => {
  const { data, error, isLoading } = useSWR<CatalogItemDto[]>(item ? `/api/search/${encodeURIComponent(item)}` : null, fetcher)

  return {
    data,
    error,
    isLoading,
  }
}

export default useSearchItem
