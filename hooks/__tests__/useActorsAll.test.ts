import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useActorsAll from '../useActorsAll';

jest.mock('swr');

describe('useActorsAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all actors when loaded', () => {
    const mockActors = [
      { id: '1', name: 'Actor 1' },
      { id: '2', name: 'Actor 2' },
    ];
    (useSWR as jest.Mock).mockReturnValue({
      data: mockActors,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useActorsAll());

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

    const { result } = renderHook(() => useActorsAll());

    expect(result.current.actors).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('should return loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useActorsAll());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch actors');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useActorsAll());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.actors).toEqual([]);
  });

  it('should call SWR with correct endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useActorsAll());

    expect(useSWR).toHaveBeenCalledWith('/api/actors/all', expect.any(Function));
  });
});
