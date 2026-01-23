"use client";
import useBillboard from '@/hooks/useBillborad';
import BillboardBase from './BillboardBase';

const Billboard = () => {
  const { data, isLoading } = useBillboard();

  return <BillboardBase data={data} isLoading={isLoading} priority />;
};

export default Billboard;
