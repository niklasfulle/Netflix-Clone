import { renderHook } from '@testing-library/react';
import usePlaylists from '../playlists/usePlaylists';
import useSWR from 'swr';

jest.mock('swr');

describe('usePlaylists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of playlists', () => {
    const mockPlaylists = [
      { id: '1', name: 'Playlist 1' },
      { id: '2', name: 'Playlist 2' },
    ];

    const mockMutate = jest.fn();

    (useSWR as jest.Mock).mockReturnValue({
      data: mockPlaylists,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => usePlaylists());

    expect(result.current.data).toEqual(mockPlaylists);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.mutate).toBeDefined();
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => usePlaylists());

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => usePlaylists());

    expect(result.current.error).toEqual(mockError);
  });

  it('should call useSWR with playlist endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    renderHook(() => usePlaylists());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/playlist',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('should have mutate function available', () => {
    const mockMutate = jest.fn();

    (useSWR as jest.Mock).mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => usePlaylists());

    expect(result.current.mutate).toBe(mockMutate);
  });

  it('should have revalidation enabled', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    renderHook(() => usePlaylists());

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
