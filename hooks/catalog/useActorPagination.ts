import { useCallback, useEffect, useState } from "react";

import {
  type CatalogContent,
  STATIC_CATALOG_OPTIONS,
  useCatalogQuery,
} from "@/hooks/catalog/useCatalogQuery";

const INITIAL_PAGE_SIZE = 3;
const PAGE_SIZE = 5;

export function useActorPagination(content: CatalogContent) {
  const [start, setStart] = useState(0);
  const [limit, setLimit] = useState(INITIAL_PAGE_SIZE);
  const [actors, setActors] = useState<string[]>([]);

  const countQuery = useCatalogQuery<number>(
    content,
    { kind: "actorCount" },
    STATIC_CATALOG_OPTIONS,
  );
  const actorsQuery = useCatalogQuery<string[]>(
    content,
    { kind: "actors", start, limit },
    STATIC_CATALOG_OPTIONS,
  );

  useEffect(() => {
    if (!actorsQuery.data) return;
    setActors((current) => Array.from(new Set([...current, ...actorsQuery.data!])))
  }, [actorsQuery.data]);

  const loadMore = useCallback(() => {
    setStart((current) => current + limit);
    setLimit(PAGE_SIZE);
  }, [limit]);

  const actorsCount = countQuery.data ?? 0;

  return {
    actors,
    actorsCount,
    error: countQuery.error ?? actorsQuery.error,
    hasMore: actors.length < actorsCount,
    isLoading: countQuery.isLoading || actorsQuery.isLoading,
    loadMore,
  };
}
