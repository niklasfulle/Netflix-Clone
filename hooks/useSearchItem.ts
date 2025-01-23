import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useSearchItem = (item: string) => {
  const { data, error, isLoading } = useSWR(item ? `/api/search/${item}` : null, fetcher)

  return {
    data,
    error,
    isLoading,
  }
}

export default useSearchItem