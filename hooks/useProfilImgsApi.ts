import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const useProfilImgsApi = () => {
  const { data, error, isLoading, mutate } = useSWR("/api/profilimg", fetcher)

  return {
    data,
    error,
    isLoading,
    mutate
  }
}

export default useProfilImgsApi