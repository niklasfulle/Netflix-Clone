import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useRandomMovieList from '../movies/useRandomMovieList';

jest.mock('swr');

describe('useRandomMovieList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return random movies data when loaded', () => {
    const mockMovies = [
      { id: '1', title: 'Random Movie 1', type: 'Movie' },
      { id: '2', title: 'Random Movie 2', type: 'Movie' },
    ];
    (useSWR as jest.Mock).mockReturnValue({
      data: mockMovies,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useRandomMovieList());

    expect(result.current.data).toEqual(mockMovies);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useRandomMovieList());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch random movies');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useRandomMovieList());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('should call SWR with correct endpoint pattern and count parameter', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useRandomMovieList());

    const callArgs = (useSWR as jest.Mock).mock.calls[0];
    const endpoint = callArgs[0];
    const options = callArgs[2];

    // Prüfe dass der Endpoint das richtige Muster hat
    expect(endpoint).toMatch(/^\/api\/movies\/random\?count=20&t=\d+$/);
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

    renderHook(() => useRandomMovieList());

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

    const { unmount } = renderHook(() => useRandomMovieList());
    const firstKey = (useSWR as jest.Mock).mock.calls[0][0];
    unmount();

    // Kleine Verzögerung um sicherzustellen, dass Date.now() unterschiedlich ist
    await new Promise(resolve => setTimeout(resolve, 5));

    jest.clearAllMocks();
    renderHook(() => useRandomMovieList());
    const secondKey = (useSWR as jest.Mock).mock.calls[0][0];

    // Die Keys sollten unterschiedlich sein (verschiedene Timestamps)
    expect(firstKey).toMatch(/\/api\/movies\/random\?count=20&t=\d+/);
    expect(secondKey).toMatch(/\/api\/movies\/random\?count=20&t=\d+/);
    expect(firstKey).not.toBe(secondKey);
  });

  it('should return empty array when no movies available', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useRandomMovieList());

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
