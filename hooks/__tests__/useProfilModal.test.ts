import { renderHook, act } from '@testing-library/react';
import useProfilModal from '../useProfilModal';

describe('useProfilModal', () => {
  beforeEach(() => {
    useProfilModal.setState({ isOpen: false, profilImg: undefined });
  });

  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useProfilModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.profilImg).toBeUndefined();
  });

  it('should open modal with profilImg', () => {
    const { result } = renderHook(() => useProfilModal());
    const testImg = '/path/to/image.jpg';

    act(() => {
      result.current.openModal(testImg);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.profilImg).toBe(testImg);
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useProfilModal());

    act(() => {
      result.current.openModal('/image.jpg');
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.profilImg).toBeUndefined();
  });

  it('should update profilImg when opening different modal', () => {
    const { result } = renderHook(() => useProfilModal());

    act(() => {
      result.current.openModal('/image1.jpg');
    });
    expect(result.current.profilImg).toBe('/image1.jpg');

    act(() => {
      result.current.openModal('/image2.jpg');
    });
    expect(result.current.profilImg).toBe('/image2.jpg');
  });

  it('should share state across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useProfilModal());
    const { result: result2 } = renderHook(() => useProfilModal());

    act(() => {
      result1.current.openModal('/shared.jpg');
    });

    expect(result2.current.isOpen).toBe(true);
    expect(result2.current.profilImg).toBe('/shared.jpg');
  });

  it('should handle multiple open/close cycles', () => {
    const { result } = renderHook(() => useProfilModal());

    act(() => {
      result.current.openModal('/img1.jpg');
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openModal('/img2.jpg');
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.profilImg).toBe('/img2.jpg');
  });
});
