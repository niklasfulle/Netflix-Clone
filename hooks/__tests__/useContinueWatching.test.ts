import { renderHook } from '@testing-library/react';
import useSWR from 'swr';

import useContinueWatching from '@/hooks/useContinueWatching';

jest.mock('swr');

describe('useContinueWatching', () => {
  beforeEach(() => jest.clearAllMocks());

  test('loads the continue-watching endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: [{ id: 'movie-1' }],
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useContinueWatching());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/continue-watching',
      expect.any(Function),
      expect.any(Object)
    );
    expect(result.current.data).toEqual([{ id: 'movie-1' }]);
  });

  test('exposes loading and error states', () => {
    const error = new Error('Failed');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error,
      isLoading: true,
    });

    const { result } = renderHook(() => useContinueWatching());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(error);
  });
});
