import React from 'react';

import BillboardBase from '@/components/BillboardBase';
import useBillboradSeries from '@/hooks/series/useBillboradSeries';

const BillboardSeries = () => {
  const { data, isLoading } = useBillboradSeries();

  return <BillboardBase data={data} isLoading={isLoading} />;
};

export default BillboardSeries;
