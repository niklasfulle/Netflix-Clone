import { STATIC_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useGetActors = (start: number, limit: number) =>
  useCatalogQuery<string[]>('series', { kind: 'actors', start, limit }, STATIC_CATALOG_OPTIONS);
export default useGetActors;
