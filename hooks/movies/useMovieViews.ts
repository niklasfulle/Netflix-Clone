import { LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useMovieViews = (id?: string) => useCatalogQuery<{ count: number }>('movies', { kind: 'views', id }, LIVE_CATALOG_OPTIONS);
export default useMovieViews;
