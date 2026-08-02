import { LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';
import type { CatalogCardDto } from '@/lib/catalog';

// Keep this export name for existing consumers while the shared catalog query
// makes the compatibility endpoint explicit.
const useNewMovieList2 = () => useCatalogQuery<CatalogCardDto[]>('movies', { kind: 'compatibilityNew' }, LIVE_CATALOG_OPTIONS);
export default useNewMovieList2;
