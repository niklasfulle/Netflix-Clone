import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useCurrentUser() {
  const { data, error, isLoading } = useSWR('/api/current/user', fetcher);
  return {
    user: data,
    isLoading,
    error,
  };
}
