import { CatalogItemDto, LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useBillboradMovie = () => useCatalogQuery<CatalogItemDto | null>('movies', { kind: 'billboard' }, LIVE_CATALOG_OPTIONS);
export default useBillboradMovie;
