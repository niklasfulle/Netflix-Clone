import { renderHook } from '@testing-library/react';
import useMovie from '../movies/useMovie';
import useSWR from 'swr';

jest.mock('swr');

describe('useMovie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch movie when id is provided', () => {
    const mockMovie = {
      id: '1',
      title: 'Test Movie',
      description: 'Test Description',
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockMovie,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useMovie('1'));

    expect(result.current.data).toEqual(mockMovie);
    expect(useSWR).toHaveBeenCalledWith(
      '/api/movies/1',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('should not fetch when id is undefined', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useMovie());

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useMovie('1'));

    expect(result.current.error).toEqual(mockError);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useMovie('1'));

    expect(result.current.isLoading).toBe(true);
  });

  it('should have revalidation enabled', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useMovie('1'));

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
