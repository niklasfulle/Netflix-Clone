import { LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useMovieList = () => useCatalogQuery('movies', { kind: 'list' }, LIVE_CATALOG_OPTIONS);
export default useMovieList;
