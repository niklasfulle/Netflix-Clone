import { buildCatalogEndpoint } from '@/hooks/catalog/useCatalogQuery';

describe('buildCatalogEndpoint', () => {
  it.each([
    ['movies', { kind: 'list' }, '/api/movies'],
    ['series', { kind: 'list' }, '/api/series'],
    ['movies', { kind: 'billboard' }, '/api/random/movies'],
    ['series', { kind: 'billboard' }, '/api/random/series'],
    ['movies', { kind: 'actors', start: 10, limit: 5 }, '/api/movies/getActors/10_5'],
    ['series', { kind: 'actors', limit: 5 }, '/api/series/getActors/0_5'],
    ['series', { kind: 'compatibilityNew' }, '/api/series/newSeries'],
    ['movies', { kind: 'new' }, '/api/movies/new'],
    ['series', { kind: 'new' }, '/api/series/newSeries'],
    ['movies', { kind: 'views' }, null],
    ['movies', { kind: 'views', id: 'item/one' }, '/api/movies/item%2Fone/views'],
    ['series', { kind: 'item', id: 'item/one' }, '/api/series/item%2Fone'],
    ['series', { kind: 'actorCount' }, '/api/series/getActorsCount'],
    ['movies', { kind: 'actor', actor: 'Actor' }, '/api/movies/moviesByActor/Actor'],
    ['movies', { kind: 'random', count: 5, nonce: 10 }, '/api/movies/random?count=5&t=10'],
    ['series', { kind: 'actor', actor: 'A/B' }, '/api/series/seriesByActor/A%2FB'],
    ['movies', { kind: 'compatibilityNew' }, '/api/movies/newMovies'],
  ] as const)('builds %s %o endpoints', (content, query, expected) => {
    expect(buildCatalogEndpoint(content, query)).toBe(expected);
  });

  it('returns null when a conditional endpoint has no identifier', () => {
    expect(buildCatalogEndpoint('movies', { kind: 'item', id: undefined })).toBeNull();
    expect(buildCatalogEndpoint('series', { kind: 'actor', actor: '' })).toBeNull();
    expect(buildCatalogEndpoint('movies', { kind: 'actors', limit: 0 })).toBeNull();
  });
});
