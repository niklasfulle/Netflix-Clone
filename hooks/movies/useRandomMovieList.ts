import { useState } from 'react';

import { STATIC_CATALOG_OPTIONS, useCatalogQuery } from '@/hooks/catalog/useCatalogQuery';

const useMovieList = () => {
  const [nonce] = useState(Date.now);
  return useCatalogQuery('movies', { kind: 'random', count: 20, nonce }, {
    ...STATIC_CATALOG_OPTIONS,
    dedupingInterval: 0,
  });
};
export default useMovieList;
