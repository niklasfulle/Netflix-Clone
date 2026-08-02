import { act, renderHook } from '@testing-library/react';

import { useNearViewport } from '@/hooks/useNearViewport';

describe('useNearViewport', () => {
  it('stays deferred until the observed element approaches the viewport', () => {
    let intersectionCallback: IntersectionObserverCallback = () => undefined;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const OriginalIntersectionObserver = global.IntersectionObserver;

    global.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
      intersectionCallback = callback;
      return { observe, disconnect } as unknown as IntersectionObserver;
    }) as unknown as typeof IntersectionObserver;

    const element = document.createElement('div');
    const { result } = renderHook(() => useNearViewport<HTMLDivElement>());

    act(() => result.current.ref(element));
    expect(result.current.isNearViewport).toBe(false);
    expect(observe).toHaveBeenCalledWith(element);

    act(() => intersectionCallback([
      { isIntersecting: true } as IntersectionObserverEntry,
    ], {} as IntersectionObserver));

    expect(result.current.isNearViewport).toBe(true);
    expect(disconnect).toHaveBeenCalled();
    global.IntersectionObserver = OriginalIntersectionObserver;
  });
});
