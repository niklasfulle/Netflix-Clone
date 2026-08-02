import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { ProfileImageDto } from '@/lib/api-types';

const useProfilImgsApi = () => {
  const { data, error, isLoading, mutate } = useSWR<ProfileImageDto[]>("/api/profilimg", fetcher)

  return {
    data,
    error,
    isLoading,
    mutate
  }
}

export default useProfilImgsApi
