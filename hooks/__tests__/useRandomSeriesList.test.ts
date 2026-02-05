import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useRandomSeriesList from '../series/useRandomSeriesList';

jest.mock('swr');

describe('useRandomSeriesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return random series data when loaded', () => {
    const mockSeries = [
      { id: '1', title: 'Random Series 1', type: 'Serie' },
      { id: '2', title: 'Random Series 2', type: 'Serie' },
    ];
    (useSWR as jest.Mock).mockReturnValue({
      data: mockSeries,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useRandomSeriesList());

    expect(result.current.data).toEqual(mockSeries);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useRandomSeriesList());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch random series');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useRandomSeriesList());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('should call SWR with correct endpoint pattern and count parameter', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useRandomSeriesList());

    const callArgs = (useSWR as jest.Mock).mock.calls[0];
    const endpoint = callArgs[0];
    const options = callArgs[2];

    // Prüfe dass der Endpoint das richtige Muster hat
    expect(endpoint).toMatch(/^\/api\/series\/random\?count=20&t=\d+$/);
    expect(options.revalidateIfStale).toBe(false);
    expect(options.revalidateOnFocus).toBe(false);
    expect(options.revalidateOnReconnect).toBe(false);
  });

  it('should disable all revalidation and deduping', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useRandomSeriesList());

    const callOptions = (useSWR as jest.Mock).mock.calls[0][2];
    expect(callOptions.revalidateIfStale).toBe(false);
    expect(callOptions.revalidateOnFocus).toBe(false);
    expect(callOptions.revalidateOnReconnect).toBe(false);
  });

  it('should generate unique key with timestamp on each mount', async () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
    });

    const { unmount } = renderHook(() => useRandomSeriesList());
    const firstKey = (useSWR as jest.Mock).mock.calls[0][0];
    unmount();

    // Kleine Verzögerung um sicherzustellen, dass Date.now() unterschiedlich ist
    await new Promise(resolve => setTimeout(resolve, 5));

    jest.clearAllMocks();
    renderHook(() => useRandomSeriesList());
    const secondKey = (useSWR as jest.Mock).mock.calls[0][0];

    // Die Keys sollten unterschiedlich sein (verschiedene Timestamps)
    expect(firstKey).toMatch(/\/api\/series\/random\?count=20&t=\d+/);
    expect(secondKey).toMatch(/\/api\/series\/random\?count=20&t=\d+/);
    expect(firstKey).not.toBe(secondKey);
  });

  it('should return empty array when no series available', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useRandomSeriesList());

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
