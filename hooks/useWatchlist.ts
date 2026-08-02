import { useEffect, useState } from 'react';
import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';

async function fetchWatchlist(): Promise<CatalogItemDto[]> {
  const res = await fetch('/api/watchlist');
  if (!res.ok) throw new Error('Fehler beim Laden');
  return res.json() as Promise<CatalogItemDto[]>;
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<CatalogItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchWatchlist()
      .then(data => {
        setWatchlist(data);
        setError(null);
      })
      .catch(() => {
        setError('Error while loading the watchlist');
        setWatchlist([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { watchlist, loading, error };
}
