import { CatalogItemDto, LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useBillboradSeries = () => useCatalogQuery<CatalogItemDto | null>('series', { kind: 'billboard' }, LIVE_CATALOG_OPTIONS);
export default useBillboradSeries;
