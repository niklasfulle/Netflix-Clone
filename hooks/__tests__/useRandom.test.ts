import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useRandom from '../useRandom';

jest.mock('swr');

describe('useRandom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return random movie data when loaded', () => {
    const mockMovie = { id: '1', title: 'Random Movie', description: 'A random movie' };
    (useSWR as jest.Mock).mockReturnValue({
      data: mockMovie,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useRandom());

    expect(result.current.data).toEqual(mockMovie);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useRandom());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch random movie');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useRandom());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('should call SWR with correct endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useRandom());

    expect(useSWR).toHaveBeenCalledWith('/api/random', expect.any(Function), {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    });
  });

  it('should disable all revalidation options', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useRandom());

    const callOptions = (useSWR as jest.Mock).mock.calls[0][2];
    expect(callOptions.revalidateIfStale).toBe(false);
    expect(callOptions.revalidateOnFocus).toBe(false);
    expect(callOptions.revalidateOnReconnect).toBe(false);
  });
});
