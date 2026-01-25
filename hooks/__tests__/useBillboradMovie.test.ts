import { renderHook } from '@testing-library/react';
import useBillboradMovie from '../movies/useBillboradMovie';
import useSWR from 'swr';

jest.mock('swr');
jest.mock('@/lib/fetcher');

describe('useBillboradMovie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return billboard movie data', () => {
    const mockMovieData = {
      id: '1',
      title: 'Random Movie',
      image: 'image.jpg',
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockMovieData,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useBillboradMovie());

    expect(result.current.data).toEqual(mockMovieData);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useBillboradMovie());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useBillboradMovie());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with movies endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useBillboradMovie());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/random/movies',
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

    renderHook(() => useBillboradMovie());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
