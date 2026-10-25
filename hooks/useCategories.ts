import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { CategorySummary } from '@/lib/category-validation';

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<{ categories: CategorySummary[] }>('/api/categories', fetcher);
  return { categories: data?.categories ?? [], error, isLoading, refresh: mutate };
}
