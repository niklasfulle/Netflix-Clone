import { isEmpty } from 'lodash';
import React from 'react';

import MovieCard from './MovieCard';

interface MovieListProps {
  data: Record<string, any>[];
  title: string;
  isLoading: boolean;
}

const MovieList: React.FC<MovieListProps> = ({ data, title, isLoading }) => {
  if (isEmpty(data)) {
    return null;
  }
  console.log(data);
  return (
    <div className="px-4 my-6 space-y-8 md:px-12">
      <div>
        <p className="font-semibold text-white text-md md:text-xl lg:text-2xl">
          {title}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4 lg:grid-cols-4 md:gap-4">
          {data.map((movie) => (
            <MovieCard key={movie.id} data={movie} isLoading={isLoading} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieList;
