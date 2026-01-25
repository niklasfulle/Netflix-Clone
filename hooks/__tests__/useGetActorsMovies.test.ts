import { renderHook } from '@testing-library/react';
import useGetActors from '../movies/useGetActors';
import useSWR from 'swr';

jest.mock('swr');
jest.mock('@/lib/fetcher');

describe('useGetActors (movies)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch actors when limit is provided', () => {
    const mockActors = [{ id: '1', name: 'Actor 1' }];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockActors,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useGetActors(10));

    expect(result.current.data).toEqual(mockActors);
    expect(useSWR).toHaveBeenCalledWith(
      '/api/movies/getActors/10',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('should not fetch when limit is 0', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useGetActors(0));

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should not fetch when limit is falsy', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useGetActors(0));

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useGetActors(5));

    expect(result.current.error).toEqual(mockError);
  });

  it('should disable revalidation', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useGetActors(10));

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(false);
    expect(options.revalidateOnFocus).toBe(false);
    expect(options.revalidateOnReconnect).toBe(false);
  });
});
