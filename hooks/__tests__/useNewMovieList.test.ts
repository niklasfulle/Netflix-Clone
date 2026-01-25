import { renderHook } from '@testing-library/react';
import useNewMovieList from '../movies/useNewMovieList';
import useSWR from 'swr';

jest.mock('swr');

describe('useNewMovieList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of new movies', () => {
    const mockMovies = [
      { id: '1', title: 'New Movie 1', releaseDate: '2024-01-20' },
      { id: '2', title: 'New Movie 2', releaseDate: '2024-01-21' },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockMovies,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useNewMovieList());

    expect(result.current.data).toEqual(mockMovies);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useNewMovieList());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useNewMovieList());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with new movies endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useNewMovieList());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/movies/new',
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

    renderHook(() => useNewMovieList());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
