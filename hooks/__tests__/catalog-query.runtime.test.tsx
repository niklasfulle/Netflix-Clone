import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import { useCatalogQuery } from '../catalog/useCatalogQuery';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

it('loads catalog data through the default query configuration', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, headers: new Map([['content-type', 'application/json']]), json: async () => [{ id: 'movie-1', title: 'Film' }] });
  const { result } = renderHook(() => useCatalogQuery('movies', { kind: 'list' }), { wrapper: ({ children }: { children: ReactNode }) => <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig> });
  await waitFor(() => expect(result.current.data).toEqual([{ id: 'movie-1', title: 'Film' }]));
  expect(result.current.isLoading).toBe(false);
  expect(global.fetch).toHaveBeenCalledWith('/api/movies', { headers: { Accept: 'application/json' } });
});
