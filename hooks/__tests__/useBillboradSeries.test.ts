import { renderHook } from '@testing-library/react';
import useBillboradSeries from '../series/useBillboradSeries';
import useSWR from 'swr';

jest.mock('swr');

describe('useBillboradSeries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return billboard series data', () => {
    const mockSeriesData = {
      id: '1',
      title: 'Random Series',
      image: 'image.jpg',
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockSeriesData,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useBillboradSeries());

    expect(result.current.data).toEqual(mockSeriesData);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useBillboradSeries());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useBillboradSeries());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with series endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useBillboradSeries());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/random/series',
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

    renderHook(() => useBillboradSeries());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
