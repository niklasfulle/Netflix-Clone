import { renderHook } from '@testing-library/react';
import useNewSeriesList from '../series/useNewSeriesList';
import useSWR from 'swr';

jest.mock('swr');

describe('useNewSeriesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of new series', () => {
    const mockSeries = [
      { id: '1', title: 'New Series 1' },
      { id: '2', title: 'New Series 2' },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockSeries,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useNewSeriesList());

    expect(result.current.data).toEqual(mockSeries);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useNewSeriesList());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useNewSeriesList());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with new series endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useNewSeriesList());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/series/newSeries',
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

    renderHook(() => useNewSeriesList());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
