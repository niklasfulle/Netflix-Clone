import React from 'react';

import FilterRowBase from '@/components/FilterRowBase';
import useSeriesByActor from '@/hooks/series/useSeriesByActor';
import { useNearViewport } from '@/hooks/useNearViewport';

interface FilterRowSeriesProps {
  title: string;
  deferLoading?: boolean;
}

const FilterRowSeries: React.FC<FilterRowSeriesProps> = ({
  title,
  deferLoading = false,
}) => {
  const { ref, isNearViewport } = useNearViewport<HTMLDivElement>(deferLoading);
  const shouldLoad = !deferLoading || isNearViewport;
  const { data: movies = [], isLoading: isLoadingSeriesByActor } =
    useSeriesByActor(shouldLoad ? title : '');

  return (
    <div ref={deferLoading ? ref : undefined}>
      <FilterRowBase
        title={title}
        movies={movies}
        isLoading={!shouldLoad || isLoadingSeriesByActor}
      />
    </div>
  );
};

export default FilterRowSeries;
