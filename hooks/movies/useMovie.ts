import { CatalogItemDto, LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useMovie = (id?: string) => useCatalogQuery<CatalogItemDto>('movies', { kind: 'item', id }, LIVE_CATALOG_OPTIONS);
export default useMovie;
