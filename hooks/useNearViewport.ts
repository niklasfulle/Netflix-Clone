import { useCallback, useEffect, useState, type RefCallback } from 'react';

export function useNearViewport<T extends Element>(
  observe = true,
  rootMargin = '600px 0px',
) {
  const [element, setElement] = useState<T | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const ref: RefCallback<T> = useCallback((node) => setElement(node), []);

  useEffect(() => {
    if (!observe || !element || isNearViewport) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setIsNearViewport(true);
      observer.disconnect();
    }, { rootMargin });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, isNearViewport, observe, rootMargin]);

  return { ref, isNearViewport };
}
