import { renderHook } from '@testing-library/react';
import useSeriesList from '../series/useSeriesList';
import useSWR from 'swr';

jest.mock('swr');

describe('useSeriesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of series', () => {
    const mockSeries = [
      { id: '1', title: 'Series 1' },
      { id: '2', title: 'Series 2' },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockSeries,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useSeriesList());

    expect(result.current.data).toEqual(mockSeries);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useSeriesList());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useSeriesList());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with series endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useSeriesList());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/series',
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

    renderHook(() => useSeriesList());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
