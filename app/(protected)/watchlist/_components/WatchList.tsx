import { isEmpty } from 'lodash';
import React from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';

import MovieCard from '@/components/MovieCard';
import { useLanguage } from '@/components/providers/LanguageProvider';


interface WatchListProps {
  title: string;
}

const WatchList: React.FC<WatchListProps> = ({ title }) => {
  const { watchlist, loading, error, hasMore, loadingMore, loadMore } = useWatchlist();
  const { t } = useLanguage();
  const errorMessage = error === 'Error while loading the watchlist'
    ? t('Error while loading the watchlist')
    : error;

  if (loading) {
    return  <div className="px-4 my-6 space-y-8 md:px-12"><div className="text-white text-center">{t('Loads Watchlist...')}</div></div>;
  }
  if (error && isEmpty(watchlist)) {
    return <div className="px-4 my-6 space-y-8 md:px-12"><div className="text-red-500 text-center">{errorMessage}</div></div>;
  }
  if (isEmpty(watchlist)) {
    return <div className="px-4 my-6 space-y-8 md:px-12"><div className="text-white text-center">{t('Your watchlist is empty.')}</div></div>;
  }

  return (
    <div className="px-4 my-6 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4 lg:grid-cols-4 md:gap-4">
          {watchlist.map((movie, index) => (
            <MovieCard
              key={movie.id}
              data={movie}
              isLoading={loading}
              eager={index === 0}
            />
          ))}
        </div>
        {error && <p role="alert" className="mt-4 text-red-400">{errorMessage}</p>}
        {hasMore && <div className="mt-8 flex justify-center"><button type="button" onClick={loadMore} disabled={loadingMore} className="rounded-md bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50">{loadingMore ? t('Loads Watchlist...') : t('Load more')}</button></div>}
      </div>
    </div>
  );
};

export default WatchList;
