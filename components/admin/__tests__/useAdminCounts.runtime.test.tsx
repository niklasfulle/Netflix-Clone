import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useAdminCounts } from '../useAdminCounts';

it('loads administrator counts through the real SWR request path', async () => {
  const originalFetch = global.fetch;
  const responses: Record<string, unknown> = {
    '/api/actors': [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Sam' }],
    '/api/movies/all': [{ id: 'movie', title: 'Movie' }],
    '/api/series/all': [{ id: 'one', title: 'One' }, { id: 'two', title: 'Two' }, { id: 'three', title: 'Three' }],
    '/api/statistics/admin-overview': { totalViews: 8 },
  };
  global.fetch = jest.fn(async input => ({ json: async () => responses[String(input)] } as Response));
  try {
    const { result } = renderHook(() => useAdminCounts(), { wrapper: ({ children }) => <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>{children}</SWRConfig> });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toEqual({ actorsCount: 2, moviesCount: 1, seriesCount: 3, totalViews: 8, isLoading: false });
  } finally { global.fetch = originalFetch; }
});
