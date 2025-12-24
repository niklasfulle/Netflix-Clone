// This line is added to enable SWR as a client hook
"use client";
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

const getUser = () => {
  const { data, error, isLoading } = useSWR("/api/auth/session", fetcher, {
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

export default getUser