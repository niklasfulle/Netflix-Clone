import { renderHook, waitFor } from '@testing-library/react';
import { useWatchlist } from '../useWatchlist';

globalThis.fetch = jest.fn();

describe('useWatchlist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockClear();
  });

  it('should load watchlist successfully', async () => {
    const mockWatchlist = [
      { id: '1', title: 'Movie 1' },
      { id: '2', title: 'Movie 2' },
    ];
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWatchlist,
    });

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.watchlist).toEqual(mockWatchlist);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    });

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.watchlist).toEqual([]);
    expect(result.current.error).toBe('Error while loading the watchlist');
  });

  it('should return empty watchlist initially', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.watchlist).toEqual([]);
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 2000 });
  });

  it('should call correct endpoint', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderHook(() => useWatchlist());

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/watchlist');
    }, { timeout: 2000 });
  });

  it('should handle network error', async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useWatchlist());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.error).toBe('Error while loading the watchlist');
    expect(result.current.watchlist).toEqual([]);
  });
});
