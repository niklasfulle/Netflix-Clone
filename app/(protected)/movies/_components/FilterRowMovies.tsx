import React from 'react';

import FilterRowBase from '@/components/FilterRowBase';
import useMoviesByActor from '@/hooks/movies/useMoviesByActor';

interface FilterRowMoviesProps {
  title: string;
}

const FilterRowMovies: React.FC<FilterRowMoviesProps> = ({ title }) => {
  const { data: movies = [], isLoading: isLoadingMoviesByActor } =
    useMoviesByActor(title);

  return (
    <FilterRowBase
      title={title}
      movies={movies}
      isLoading={isLoadingMoviesByActor}
    />
  );
};

export default FilterRowMovies;
