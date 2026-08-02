import { LIVE_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';
import type { CatalogCardDto } from '@/lib/catalog';

const useSeriesByActor = (actor: string) => useCatalogQuery<CatalogCardDto[]>('series', { kind: 'actor', actor }, LIVE_CATALOG_OPTIONS);
export default useSeriesByActor;
