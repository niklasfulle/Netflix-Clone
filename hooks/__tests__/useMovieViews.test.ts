import { renderHook } from '@testing-library/react';
import useMovieViews from '../movies/useMovieViews';
import useSWR from 'swr';

jest.mock('swr');

describe('useMovieViews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch movie views when movieId is provided', () => {
    const mockViews = { views: 1500, lastViewed: '2024-01-24' };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockViews,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useMovieViews('1'));

    expect(result.current.data).toEqual(mockViews);
    expect(useSWR).toHaveBeenCalledWith(
      '/api/movies/1/views',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('should not fetch when movieId is undefined', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useMovieViews());

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch views');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useMovieViews('1'));

    expect(result.current.error).toEqual(mockError);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useMovieViews('1'));

    expect(result.current.isLoading).toBe(true);
  });

  it('should have revalidation enabled', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useMovieViews('1'));

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
