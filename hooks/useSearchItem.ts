import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import { MIN_SEARCH_LENGTH, type SearchResultsDto } from '@/lib/search';

const useSearchItem = (item: string) => {
  const query = item.trim();
  const key = query.length >= MIN_SEARCH_LENGTH
    ? `/api/search/${encodeURIComponent(query)}`
    : null;
  const { data, error, isLoading } = useSWR<SearchResultsDto>(key, fetcher)

  return {
    data,
    error,
    isLoading,
  }
}

export default useSearchItem
