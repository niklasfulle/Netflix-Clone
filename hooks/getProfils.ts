import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { ProfileDto } from '@/lib/api-types';

const useProfils = () => {
  const { data, error, isLoading } = useSWR<ProfileDto[]>("/api/profil", fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    data,
    error,
    isLoading,
  }
}

export default useProfils
