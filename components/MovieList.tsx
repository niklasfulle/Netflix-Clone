import { isEmpty } from 'lodash';
import React from 'react';

import MovieCard from './MovieCard';
import type { CatalogCardDto } from '@/lib/catalog';

interface MovieListProps {
  data: CatalogCardDto[];
  title: string;
  isLoading: boolean;
}

const MovieList: React.FC<MovieListProps> = ({ data, title, isLoading }) => {
  if (isEmpty(data) && !isLoading) {
    return null;
  }
  return (
    <div className="min-h-[235px] px-4 my-6 space-y-8 md:px-12 [content-visibility:auto] [contain-intrinsic-size:auto_480px]">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4 lg:grid-cols-4 md:gap-4">
          {isEmpty(data) ? (
            <output
              aria-label={`${title} is loading`}
              className="col-span-2 h-48 animate-pulse rounded-lg bg-zinc-900 lg:col-span-4"
            />
          ) : (
            data.map((movie) => (
              <MovieCard key={movie.id} data={movie} isLoading={isLoading} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieList;
