import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useActors() {
  const { data, error, isLoading } = useSWR('/api/actors', fetcher);
  return {
    actors: data || [],
    isLoading,
    error,
  };
}
