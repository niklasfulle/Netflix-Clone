import { renderHook } from '@testing-library/react';
import useUser from '../useUser';
import useSWR from 'swr';

jest.mock('swr');

describe('useUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user session data', () => {
    const mockUserData = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockUserData,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useUser());

    expect(result.current.data).toEqual(mockUserData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch session');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useUser());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);
  });

  it('should call useSWR with correct endpoint and options', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useUser());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/auth/session',
      expect.any(Function),
      expect.objectContaining({
        revalidateIfStale: true,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      })
    );
  });

  it('should return undefined data when not loaded', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useUser());

    expect(result.current.data).toBeUndefined();
  });
});
