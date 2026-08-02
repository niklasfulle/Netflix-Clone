import useSWR, { SWRConfiguration } from 'swr';

import fetcher from '@/lib/fetcher';
import type { CatalogCardDto } from '@/lib/catalog';

export type { CatalogCardDto, CatalogItemDto } from '@/lib/catalog';

export type CatalogContent = 'movies' | 'series';
export type CatalogQuery =
  | { kind: 'list' }
  | { kind: 'billboard' }
  | { kind: 'actors'; start?: number; limit?: number }
  | { kind: 'actorCount' }
  | { kind: 'actor'; actor?: string }
  | { kind: 'item'; id?: string }
  | { kind: 'views'; id?: string }
  | { kind: 'new' }
  | { kind: 'compatibilityNew' }
  | { kind: 'random'; count: number; nonce: number };

export const LIVE_CATALOG_OPTIONS: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

export const STATIC_CATALOG_OPTIONS: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

const ACTOR_ROUTE: Record<CatalogContent, string> = {
  movies: 'moviesByActor',
  series: 'seriesByActor',
};

export function buildCatalogEndpoint(content: CatalogContent, query: CatalogQuery): string | null {
  const base = `/api/${content}`;
  switch (query.kind) {
    case 'list': return base;
    case 'billboard': return `/api/random/${content}`;
    case 'actors': return query.limit
      ? `${base}/getActors/${query.start ?? 0}_${query.limit}`
      : null;
    case 'actorCount': return `${base}/getActorsCount`;
    case 'actor': return query.actor
      ? `${base}/${ACTOR_ROUTE[content]}/${encodeURIComponent(query.actor)}`
      : null;
    case 'item': return query.id ? `${base}/${encodeURIComponent(query.id)}` : null;
    case 'views': return query.id ? `${base}/${encodeURIComponent(query.id)}/views` : null;
    case 'new': return content === 'movies' ? `${base}/new` : `${base}/newSeries`;
    case 'compatibilityNew': return content === 'movies' ? `${base}/newMovies` : `${base}/newSeries`;
    case 'random': return `${base}/random?count=${query.count}&t=${query.nonce}`;
  }
}

export function useCatalogQuery<T = CatalogCardDto[]>(
  content: CatalogContent,
  query: CatalogQuery,
  options: SWRConfiguration = {},
) {
  const key = buildCatalogEndpoint(content, query);
  const { data, error, isLoading } = useSWR<T>(key, fetcher, options);
  return { data, error, isLoading };
}
