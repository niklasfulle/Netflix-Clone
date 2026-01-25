import { renderHook, act } from '@testing-library/react';
import useCreatePlaylistModal from '../playlists/useCreatePlaylistModal';

describe('useCreatePlaylistModal', () => {
  it('should initialize with closed modal', () => {
    const { result } = renderHook(() => useCreatePlaylistModal());

    expect(result.current.isOpen).toBe(false);
  });

  it('should open modal', () => {
    const { result } = renderHook(() => useCreatePlaylistModal());

    act(() => {
      result.current.openModal('movie-1');
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useCreatePlaylistModal());

    act(() => {
      result.current.openModal('movie-1');
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle modal state multiple times', () => {
    const { result } = renderHook(() => useCreatePlaylistModal());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openModal('movie-1');
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openModal('movie-2');
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should be a shared state across multiple hooks', () => {
    const { result: result1 } = renderHook(() => useCreatePlaylistModal());
    const { result: result2 } = renderHook(() => useCreatePlaylistModal());

    act(() => {
      result1.current.openModal('movie-1');
    });

    expect(result2.current.isOpen).toBe(true);
  });
});
