import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { CurrentUserDto } from '@/lib/api-types';

export default function useCurrentUser() {
  const { data, error, isLoading } = useSWR<CurrentUserDto>('/api/current/user', fetcher);
  return {
    user: data,
    isLoading,
    error,
  };
}
