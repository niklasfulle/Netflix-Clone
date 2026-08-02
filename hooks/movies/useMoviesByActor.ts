import { LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';
import type { CatalogCardDto } from '@/lib/catalog';

const useMoviesByActor = (actor: string) => useCatalogQuery<CatalogCardDto[]>('movies', { kind: 'actor', actor }, LIVE_CATALOG_OPTIONS);
export default useMoviesByActor;
