import useSWR from 'swr';

import fetcher from '@/lib/fetcher';

const getProfils = () => {
  const { data, error, isLoading } = useSWR("/api/profil", fetcher, {
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

export default getProfils