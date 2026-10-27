export type RecommendationCandidate = {
  id: string;
  actorIds: string[];
  categoryIds: string[];
  createdAt: number;
};
export type RecommendationReason = 'same-actor' | 'similar-categories' | 'more-to-watch';
export type RecommendationWeights = {
  primaryActor: number;
  secondaryActor: number;
  category: number;
  categoryWeights: Readonly<Record<string, number>>;
};

// Initial rules, not learned weights. Category IDs can receive individual weights
// during later tuning without embedding catalog names in application code.
export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  primaryActor: 4,
  secondaryActor: 0.2,
  category: 1,
  categoryWeights: {},
};
export const RECOMMENDATION_COUNT = 6;

function overlap(left: Set<string>, right: Set<string>, weights: Readonly<Record<string, number>> = {}) {
  let matched = 0;
  let total = 0;
  for (const id of new Set([...left, ...right])) {
    const configured = weights[id];
    const weight = Number.isFinite(configured) && configured >= 0 ? configured : 1;
    total += weight;
    if (left.has(id) && right.has(id)) matched += weight;
  }
  return total > 0 ? matched / total : 0;
}

export function rankRecommendations<T extends RecommendationCandidate>(
  source: Pick<RecommendationCandidate, 'id' | 'actorIds' | 'categoryIds'>,
  candidates: T[],
  weights: RecommendationWeights = DEFAULT_RECOMMENDATION_WEIGHTS,
): Array<{ item: T; reason: RecommendationReason }> {
  const sourceActors = new Set(source.actorIds);
  const sourceCategories = new Set(source.categoryIds);
  const unique = new Map(candidates.filter(item => item.id !== source.id).map(item => [item.id, item]));
  const scored = [...unique.values()].map(item => ({
    item,
    actors: new Set(item.actorIds),
    actorScore: overlap(sourceActors, new Set(item.actorIds)),
    categoryScore: overlap(sourceCategories, new Set(item.categoryIds), weights.categoryWeights),
  }));
  type Scored = typeof scored[number];
  const priority = (entry: Scored) => entry.actorScore * weights.primaryActor + entry.categoryScore * weights.category;
  const regular = (entry: Scored) => entry.categoryScore * weights.category + entry.actorScore * weights.secondaryActor;
  const compare = (score: (entry: Scored) => number) => (a: Scored, b: Scored) => score(b) - score(a) || b.item.createdAt - a.item.createdAt || a.item.id.localeCompare(b.item.id);

  // Prefer two titles with the very same source actor where that pair exists.
  // If only individual matches exist, use the available shared-actor titles.
  const pairs = [...sourceActors].sort().map(actorId => scored.filter(entry => entry.actors.has(actorId)).sort(compare(priority)).slice(0, 2)).filter(pair => pair.length === 2);
  pairs.sort((a, b) => priority(b[0]) + priority(b[1]) - priority(a[0]) - priority(a[1]) || compare(priority)(a[0], b[0]) || compare(priority)(a[1], b[1]));
  const preferred = pairs[0] ?? scored.filter(entry => entry.actorScore > 0).sort(compare(priority)).slice(0, 2);
  const selected = new Set(preferred.map(entry => entry.item.id));
  const remaining = scored.filter(entry => !selected.has(entry.item.id)).sort(compare(regular));
  return [
    ...preferred.map(entry => ({ item: entry.item, reason: 'same-actor' as const })),
    ...remaining.map(entry => ({ item: entry.item, reason: (entry.categoryScore > 0 ? 'similar-categories' : entry.actorScore > 0 ? 'same-actor' : 'more-to-watch') as RecommendationReason })),
  ].slice(0, RECOMMENDATION_COUNT);
}
