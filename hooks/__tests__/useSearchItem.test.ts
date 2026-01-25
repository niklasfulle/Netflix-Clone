import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useSearchItem from '../useSearchItem';

jest.mock('swr');

describe('useSearchItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search for items when query is provided', () => {
    const mockResults = [
      { id: '1', title: 'Result 1' },
      { id: '2', title: 'Result 2' },
    ];
    (useSWR as jest.Mock).mockReturnValue({
      data: mockResults,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useSearchItem('test'));

    expect(result.current.data).toEqual(mockResults);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should not fetch when query is empty', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useSearchItem(''));

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it('should call correct search endpoint with query', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useSearchItem('movies'));

    expect(useSWR).toHaveBeenCalledWith('/api/search/movies', expect.any(Function));
  });

  it('should return loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useSearchItem('test'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return error state', () => {
    const mockError = new Error('Search failed');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useSearchItem('test'));

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('should return empty results', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useSearchItem('nonexistent'));

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
