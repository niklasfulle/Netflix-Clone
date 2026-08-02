import React from 'react';

import FilterRowBase from '@/components/FilterRowBase';
import useMoviesByActor from '@/hooks/movies/useMoviesByActor';
import { useNearViewport } from '@/hooks/useNearViewport';

interface FilterRowMoviesProps {
  title: string;
  deferLoading?: boolean;
}

const FilterRowMovies: React.FC<FilterRowMoviesProps> = ({
  title,
  deferLoading = false,
}) => {
  const { ref, isNearViewport } = useNearViewport<HTMLDivElement>(deferLoading);
  const shouldLoad = !deferLoading || isNearViewport;
  const { data: movies = [], isLoading: isLoadingMoviesByActor } =
    useMoviesByActor(shouldLoad ? title : '');

  return (
    <div ref={deferLoading ? ref : undefined}>
      <FilterRowBase
        title={title}
        movies={movies}
        isLoading={!shouldLoad || isLoadingMoviesByActor}
      />
    </div>
  );
};

export default FilterRowMovies;
