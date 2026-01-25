import { renderHook, act } from '@testing-library/react';
import useUpdatePlaylistModal from '../playlists/useUpdatePlaylistModal';

describe('useUpdatePlaylistModal', () => {
  it('should initialize with closed modal and no playlistId', () => {
    const { result } = renderHook(() => useUpdatePlaylistModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.playlistId).toBeUndefined();
  });

  it('should open modal with playlistId', () => {
    const { result } = renderHook(() => useUpdatePlaylistModal());

    act(() => {
      result.current.openModal('playlist-1');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.playlistId).toBe('playlist-1');
  });

  it('should close modal and clear playlistId', () => {
    const { result } = renderHook(() => useUpdatePlaylistModal());

    act(() => {
      result.current.openModal('playlist-1');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.playlistId).toBe('playlist-1');

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.playlistId).toBeUndefined();
  });

  it('should update playlistId when opening with different id', () => {
    const { result } = renderHook(() => useUpdatePlaylistModal());

    act(() => {
      result.current.openModal('playlist-1');
    });
    expect(result.current.playlistId).toBe('playlist-1');

    act(() => {
      result.current.openModal('playlist-2');
    });
    expect(result.current.playlistId).toBe('playlist-2');
  });

  it('should be a shared state across multiple hooks', () => {
    const { result: result1 } = renderHook(() => useUpdatePlaylistModal());
    const { result: result2 } = renderHook(() => useUpdatePlaylistModal());

    act(() => {
      result1.current.openModal('playlist-1');
    });

    expect(result2.current.isOpen).toBe(true);
    expect(result2.current.playlistId).toBe('playlist-1');
  });

  it('should handle multiple open/close cycles', () => {
    const { result } = renderHook(() => useUpdatePlaylistModal());

    act(() => {
      result.current.openModal('playlist-1');
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openModal('playlist-2');
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.playlistId).toBe('playlist-2');
  });
});
