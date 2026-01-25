import { renderHook } from '@testing-library/react';
import usePlaylist from '../playlists/usePlaylist';
import useSWR from 'swr';

jest.mock('swr');

describe('usePlaylist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch playlist when id is provided', () => {
    const mockPlaylist = {
      id: '1',
      name: 'My Playlist',
      entries: [{ id: '1', movieId: '1' }],
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockPlaylist,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => usePlaylist('1'));

    expect(result.current.data).toEqual(mockPlaylist);
    expect(useSWR).toHaveBeenCalledWith(
      '/api/playlist/1',
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

    renderHook(() => usePlaylist());

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => usePlaylist('1'));

    expect(result.current.error).toEqual(mockError);
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => usePlaylist('1'));

    expect(result.current.isLoading).toBe(true);
  });

  it('should have revalidation enabled', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => usePlaylist('1'));

    const options = (useSWR as jest.Mock).mock.calls[0][2];
    expect(options.revalidateIfStale).toBe(true);
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
  });
});
