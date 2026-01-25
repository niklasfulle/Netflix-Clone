import { renderHook } from '@testing-library/react';
import useSeriesByActor from '../series/useSeriesByActor';
import useSWR from 'swr';

jest.mock('swr');

describe('useSeriesByActor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch series by actor when actor is provided', () => {
    const mockSeries = [
      { id: '1', title: 'Series 1', actors: ['Actor 1'] },
      { id: '2', title: 'Series 2', actors: ['Actor 1'] },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockSeries,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useSeriesByActor('Actor 1'));

    expect(result.current.data).toEqual(mockSeries);
    expect(useSWR).toHaveBeenCalledWith(
      '/api/series/seriesByActor/Actor 1',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('should not fetch when actor is empty string', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useSeriesByActor(''));

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useSeriesByActor('Actor 1'));

    expect(result.current.error).toEqual(mockError);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useSeriesByActor('Actor 1'));

    expect(result.current.isLoading).toBe(true);
  });

  it('should have revalidation enabled', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useSeriesByActor('Actor 1'));

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
