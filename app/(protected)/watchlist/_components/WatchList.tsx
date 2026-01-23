import { isEmpty } from 'lodash';
import React from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';

import MovieCard from '@/components/MovieCard';


interface WatchListProps {
  title: string;
}

const WatchList: React.FC<WatchListProps> = ({ title }) => {
  const { watchlist, loading, error } = useWatchlist();

  if (loading) {
    return  <div className="px-4 my-6 space-y-8 md:px-12"><div className="text-white text-center">Loads Watchlist...</div></div>;
  }
  if (error) {
    return <div className="px-4 my-6 space-y-8 md:px-12"><div className="text-red-500 text-center">{error}</div></div>;
  }
  if (isEmpty(watchlist)) {
    return <div className="px-4 my-6 space-y-8 md:px-12"><div className="text-white text-center">Your watchlist is empty.</div></div>;
  }

  return (
    <div className="px-4 my-6 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4 lg:grid-cols-4 md:gap-4">
          {watchlist.map((movie) => (
            <MovieCard key={movie.id} data={movie} isLoading={loading} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WatchList;
