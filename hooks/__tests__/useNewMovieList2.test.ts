import { renderHook } from '@testing-library/react';
import useNewMovieList2 from '../movies/useNewMovieList2';
import useSWR from 'swr';

jest.mock('swr');

describe('useNewMovieList2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of new movies', () => {
    const mockMovies = [
      { id: '1', title: 'New Movie 1' },
      { id: '2', title: 'New Movie 2' },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockMovies,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useNewMovieList2());

    expect(result.current.data).toEqual(mockMovies);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useNewMovieList2());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useNewMovieList2());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with newMovies endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useNewMovieList2());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/movies/newMovies',
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

    renderHook(() => useNewMovieList2());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
