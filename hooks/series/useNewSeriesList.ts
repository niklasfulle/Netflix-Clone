import { LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';
import type { CatalogCardDto } from '@/lib/catalog';

const useNewSeriesList = () => useCatalogQuery<CatalogCardDto[]>('series', { kind: 'new' }, LIVE_CATALOG_OPTIONS);
export default useNewSeriesList;
