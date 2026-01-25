import { renderHook } from '@testing-library/react';
import useGetActorsCount from '../movies/useGetActorsCount';
import useSWR from 'swr';

jest.mock('swr');

describe('useGetActorsCount (movies)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return actors count', () => {
    const mockCount = { count: 150 };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockCount,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useGetActorsCount());

    expect(result.current.data).toEqual(mockCount);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useGetActorsCount());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useGetActorsCount());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with correct endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useGetActorsCount());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/movies/getActorsCount',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('should disable revalidation', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useGetActorsCount());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(false);
    expect(options.revalidateOnFocus).toBe(false);
    expect(options.revalidateOnReconnect).toBe(false);
  });
});
