import { LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useNewMovieList = () => useCatalogQuery('movies', { kind: 'new' }, LIVE_CATALOG_OPTIONS);
export default useNewMovieList;
