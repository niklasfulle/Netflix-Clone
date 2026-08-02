import { buildCatalogEndpoint } from '@/hooks/catalog/useCatalogQuery';

describe('buildCatalogEndpoint', () => {
  it.each([
    ['movies', { kind: 'list' }, '/api/movies'],
    ['series', { kind: 'list' }, '/api/series'],
    ['movies', { kind: 'billboard' }, '/api/random/movies'],
    ['series', { kind: 'billboard' }, '/api/random/series'],
    ['movies', { kind: 'actors', start: 10, limit: 5 }, '/api/movies/getActors/10_5'],
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
