import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useFavorites from '../useFavorites';

jest.mock('swr');

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return favorites data when loaded', () => {
    const mockFavorites = [
      { id: '1', title: 'Movie 1' },
      { id: '2', title: 'Movie 2' },
    ];
    const mockMutate = jest.fn();
    (useSWR as jest.Mock).mockReturnValue({
      data: mockFavorites,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useFavorites());

    expect(result.current.data).toEqual(mockFavorites);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFavorites());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch favorites');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFavorites());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('should return empty array when no favorites', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useFavorites());

    expect(result.current.data).toEqual([]);
  });

  it('should provide mutate function for cache invalidation', () => {
    const mockMutate = jest.fn();
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useFavorites());

    expect(result.current.mutate).toBe(mockMutate);
  });

  it('should call SWR with revalidation options', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    renderHook(() => useFavorites());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/favorites',
      expect.any(Function),
      {
        revalidateIfStale: true,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      }
    );
  });

  it('should accept optional id parameter', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    renderHook(() => useFavorites('user-123'));

    expect(useSWR).toHaveBeenCalled();
  });
});
