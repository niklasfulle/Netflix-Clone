import { renderHook, act } from '@testing-library/react';
import useInfoModal from '../useInfoModal';

describe('useInfoModal', () => {
  beforeEach(() => {
    // Clear Zustand store state between tests
    const store = useInfoModal.getState();
    useInfoModal.setState({ isOpen: false, movieId: undefined });
  });

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useInfoModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.movieId).toBeUndefined();
  });

  it('should open modal with movieId', () => {
    const { result } = renderHook(() => useInfoModal());
    const testMovieId = 'movie-123';

    act(() => {
      result.current.openModal(testMovieId);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.movieId).toBe(testMovieId);
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useInfoModal());

    act(() => {
      result.current.openModal('movie-123');
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.movieId).toBeUndefined();
  });

  it('should handle multiple open/close cycles', () => {
    const { result } = renderHook(() => useInfoModal());

    act(() => {
      result.current.openModal('movie-1');
    });
    expect(result.current.movieId).toBe('movie-1');

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openModal('movie-2');
    });
    expect(result.current.movieId).toBe('movie-2');
    expect(result.current.isOpen).toBe(true);
  });

  it('should update movieId when opening different modal', () => {
    const { result } = renderHook(() => useInfoModal());

    act(() => {
      result.current.openModal('movie-1');
    });
    expect(result.current.movieId).toBe('movie-1');

    act(() => {
      result.current.openModal('movie-2');
    });
    expect(result.current.movieId).toBe('movie-2');
  });

  it('should share state across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useInfoModal());
    const { result: result2 } = renderHook(() => useInfoModal());

    act(() => {
      result1.current.openModal('movie-123');
    });

    expect(result2.current.isOpen).toBe(true);
    expect(result2.current.movieId).toBe('movie-123');
  });
});
