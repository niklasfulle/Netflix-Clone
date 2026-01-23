import { useEffect, useState } from 'react';

async function fetchWatchlist() {
  const res = await fetch('/api/watchlist');
  if (!res.ok) throw new Error('Fehler beim Laden');
  return res.json();
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchWatchlist()
      .then(data => {
        setWatchlist(data);
        setError(null);
      })
      .catch(err => {
        setError('Error while loading the watchlist');
        setWatchlist([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { watchlist, loading, error };
}
