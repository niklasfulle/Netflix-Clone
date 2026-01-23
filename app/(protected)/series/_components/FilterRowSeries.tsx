import React from 'react';

import FilterRowBase from '@/components/FilterRowBase';
import useSeriesByActor from '@/hooks/series/useSeriesByActor';

interface FilterRowSeriesProps {
  title: string;
}

const FilterRowSeries: React.FC<FilterRowSeriesProps> = ({ title }) => {
  const { data: movies = [], isLoading: isLoadingSeriesByActor } =
    useSeriesByActor(title);

  return (
    <FilterRowBase
      title={title}
      movies={movies}
      isLoading={isLoadingSeriesByActor}
    />
  );
};

export default FilterRowSeries;
