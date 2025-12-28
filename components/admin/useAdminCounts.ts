
import useSWR from "swr";

interface Actor {
  id: string;
  name: string;
  // add more fields as needed
}

interface Movie {
  id: string;
  title: string;
  // add more fields as needed
}

interface Series {
  id: string;
  title: string;
  // add more fields as needed
}

interface Stats {
  totalViews: number;
  // add more fields as needed
}


export function useAdminCounts() {
  // Fetch actors
  const { data: actors } = useSWR<Actor[]>(
    "/api/actors",
    (url: string): Promise<Actor[]> => fetch(url).then(r => r.json())
  );
  // Fetch movies
  const { data: movies } = useSWR<Movie[]>(
    "/api/movies/all",
    (url: string): Promise<Movie[]> => fetch(url).then(r => r.json())
  );
  // Fetch series
  const { data: series } = useSWR<Series[]>(
    "/api/series/all",
    (url: string): Promise<Series[]> => fetch(url).then(r => r.json())
  );
  // Fetch statistics (for total views)
  const { data: stats } = useSWR<Stats>(
    "/api/statistics/admin-overview",
    (url: string): Promise<Stats> => fetch(url).then(r => r.json())
  );

  return {
    actorsCount: actors?.length ?? 0,
    moviesCount: movies?.length ?? 0,
    seriesCount: series?.length ?? 0,
    totalViews: stats?.totalViews ?? 0,
    isLoading: !actors || !movies || !series || !stats,
  };
}
