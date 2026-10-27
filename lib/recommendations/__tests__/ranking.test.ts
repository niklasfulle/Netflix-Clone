import { DEFAULT_RECOMMENDATION_WEIGHTS, rankRecommendations, type RecommendationCandidate } from '../ranking';

const source = { id: 'current', actorIds: ['actor-a'], categoryIds: ['forest', 'city'] };
function item(id: string, actorIds: string[] = [], categoryIds: string[] = [], createdAt = 1): RecommendationCandidate { return { id, actorIds, categoryIds, createdAt }; }

it('reserves the first two slots for shared actors even when other titles match more categories', () => {
  const result = rankRecommendations(source, [item('actor-one', ['actor-a']), item('actor-two', ['actor-a'], ['other']), ...Array.from({ length: 8 }, (_, i) => item(`category-${i}`, [], ['forest', 'city'], 10))]);
  expect(result).toHaveLength(6);
  expect(new Set(result.slice(0, 2).map(entry => entry.item.id))).toEqual(new Set(['actor-one', 'actor-two']));
  expect(result.slice(0, 2).every(entry => entry.reason === 'same-actor')).toBe(true);
  expect(result.slice(2).every(entry => entry.reason === 'similar-categories')).toBe(true);
});
it('chooses a pair with one common source actor when multiple source actors exist', () => {
  const result = rankRecommendations({ ...source, actorIds: ['actor-a', 'actor-b'] }, [item('single-a', ['actor-a'], ['forest', 'city']), item('pair-b-1', ['actor-b']), item('pair-b-2', ['actor-b'])]);
  expect(result.slice(0, 2).every(entry => entry.item.actorIds.includes('actor-b'))).toBe(true);
});
it('uses the available actor matches without inventing a second title', () => {
  const result = rankRecommendations(source, [item('only-match', ['actor-a']), item('other', [], ['forest'])]);
  expect(result.map(entry => entry.item.id)).toEqual(['only-match', 'other']);
});
it('counts a category once and supports later individual category weighting', () => {
  const result = rankRecommendations(source, [item('new-city', [], ['city', 'city'], 20), item('old-forest', [], ['forest'], 1)], { ...DEFAULT_RECOMMENDATION_WEIGHTS, categoryWeights: { forest: 10, city: 1 } });
  expect(result[0].item.id).toBe('old-forest');
});
it('excludes the current title and duplicates and falls back to recent published candidates', () => {
  const recent = item('recent', [], [], 20);
  const result = rankRecommendations({ id: 'current', actorIds: [], categoryIds: [] }, [item('current'), recent, recent, item('old', [], [], 1)]);
  expect(result.map(entry => entry.item.id)).toEqual(['recent', 'old']);
  expect(result.every(entry => entry.reason === 'more-to-watch')).toBe(true);
});
it('does not let repeated interval labels increase a candidate score', () => {
  const first = item('a', [], ['forest'], 1);
  const second = item('b', [], ['forest', 'forest', 'forest'], 1);
  expect(rankRecommendations(source, [second, first]).map(entry => entry.item.id)).toEqual(['a', 'b']);
});
