import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useCurrentUser from '../useCurrentUser';

jest.mock('swr');

describe('useCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data when loaded', () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    (useSWR as jest.Mock).mockReturnValue({
      data: mockUser,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeUndefined();
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch user');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.user).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should call SWR with correct endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useCurrentUser());

    expect(useSWR).toHaveBeenCalledWith('/api/current/user', expect.any(Function));
  });

  it('should handle null user data', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: null,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
