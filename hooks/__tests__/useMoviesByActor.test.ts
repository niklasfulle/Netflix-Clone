import { renderHook } from '@testing-library/react';
import useMoviesByActor from '../movies/useMoviesByActor';
import useSWR from 'swr';

jest.mock('swr');

describe('useMoviesByActor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch movies by actor when actor is provided', () => {
    const mockMovies = [
      { id: '1', title: 'Movie 1', actors: ['Tom Cruise'] },
      { id: '2', title: 'Movie 2', actors: ['Tom Cruise'] },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockMovies,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useMoviesByActor('Tom Cruise'));

    expect(result.current.data).toEqual(mockMovies);
    expect(useSWR).toHaveBeenCalledWith(
      '/api/movies/moviesByActor/Tom Cruise',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('should not fetch when actor is empty string', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useMoviesByActor(''));

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useMoviesByActor('Tom Cruise'));

    expect(result.current.error).toEqual(mockError);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useMoviesByActor('Tom Cruise'));

    expect(result.current.isLoading).toBe(true);
  });

  it('should have revalidation enabled', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useMoviesByActor('Tom Cruise'));

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
