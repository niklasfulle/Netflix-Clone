import { STATIC_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useGetActorsCount = () => useCatalogQuery<number>('movies', { kind: 'actorCount' }, STATIC_CATALOG_OPTIONS);
export default useGetActorsCount;
