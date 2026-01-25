import { renderHook } from '@testing-library/react';
import useActors from '../useActors';
import useSWR from 'swr';

jest.mock('swr');
jest.mock('@/lib/fetcher');

describe('useActors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return actors data on successful fetch', async () => {
    const mockActors = [
      { id: '1', name: 'Actor 1' },
      { id: '2', name: 'Actor 2' },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockActors,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useActors());

    expect(result.current.actors).toEqual(mockActors);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return empty array when data is undefined', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useActors());

    expect(result.current.actors).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useActors());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.actors).toEqual([]);
  });

  it('should call useSWR with correct endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useActors());

    expect(useSWR).toHaveBeenCalledWith('/api/actors', expect.any(Function));
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useActors());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.actors).toEqual([]);
  });
});
