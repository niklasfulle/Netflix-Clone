'use client';

import { useEffect, useState } from 'react';

export function useBillboardVideoAvailability(
  movieId: string | undefined,
  enabled: boolean,
) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(false);
    if (!enabled || !movieId) return;

    const controller = new AbortController();
    fetch(`/api/video/billboard/${movieId}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setAvailable(
            response.ok && response.headers.get('x-video-available') === 'true',
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });

    return () => controller.abort();
  }, [enabled, movieId]);

  return available;
}
