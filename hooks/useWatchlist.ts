import { useCallback, useEffect, useRef, useState } from 'react';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';

async function fetchWatchlist(offset = 0): Promise<{ items: CatalogItemDto[]; hasMore: boolean }> {
  const res = await fetch(offset ? `/api/watchlist?offset=${offset}` : '/api/watchlist');
  if (!res.ok) throw new Error('Fehler beim Laden');
  const items = await res.json() as CatalogItemDto[];
  return { items, hasMore: res.headers?.get('X-Has-More') === 'true' };
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<CatalogItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    setLoading(true);
    fetchWatchlist()
      .then(data => {
        setWatchlist(data.items);
        offsetRef.current = data.items.length;
        setHasMore(data.hasMore);
        setError(null);
      })
      .catch(() => {
        setError('Error while loading the watchlist');
        setWatchlist([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const result = await fetchWatchlist(offsetRef.current);
      offsetRef.current += result.items.length;
      setWatchlist(current => [...current, ...result.items.filter(item => !current.some(existing => existing.id === item.id))]);
      setHasMore(result.items.length > 0 && result.hasMore);
      setError(null);
    } catch { setError('Error while loading the watchlist'); }
    finally { loadingMoreRef.current = false; setLoadingMore(false); }
  }, [hasMore]);

  return { watchlist, loading, error, hasMore, loadingMore, loadMore };
}
