import { renderHook } from '@testing-library/react';
import useMovieList from '../movies/useMovieList';
import useSWR from 'swr';

jest.mock('swr');

describe('useMovieList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of movies', () => {
    const mockMovies = [
      { id: '1', title: 'Movie 1' },
      { id: '2', title: 'Movie 2' },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockMovies,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useMovieList());

    expect(result.current.data).toEqual(mockMovies);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useMovieList());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useMovieList());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with movies endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useMovieList());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/movies',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('should have revalidation enabled', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useMovieList());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
