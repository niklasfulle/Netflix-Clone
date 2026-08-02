import { LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useSeriesList = () => useCatalogQuery('series', { kind: 'list' }, LIVE_CATALOG_OPTIONS);
export default useSeriesList;
