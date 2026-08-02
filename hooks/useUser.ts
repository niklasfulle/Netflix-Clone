// This line is added to enable SWR as a client hook
"use client";
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { SessionDto } from '@/lib/api-types';

const useUser = () => {
  const { data, error, isLoading } = useSWR<SessionDto>("/api/auth/session", fetcher, {
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

export default useUser
