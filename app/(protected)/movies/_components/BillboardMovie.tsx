import React from 'react';

import BillboardBase from '@/components/BillboardBase';
import useBillboradMovie from '@/hooks/movies/useBillboradMovie';

const BillboardMovie = () => {
  const { data, isLoading } = useBillboradMovie();

  return <BillboardBase data={data} isLoading={isLoading} />;
};

export default BillboardMovie;
