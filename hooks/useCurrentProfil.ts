import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { ProfileDto } from '@/lib/api-types';

const useCurrentProfil = () => {
  const { data, error, isLoading, mutate } = useSWR<ProfileDto | null>("/api/current/profil", fetcher)

  return {
    data,
    error,
    isLoading,
    mutate
  }
}

export default useCurrentProfil
