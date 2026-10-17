"use client";

import { useCallback, useEffect, useRef } from "react";

export function useUploadTitleNotification() {
  const mounted = useRef(false);
  const notification = useRef<{ original: string; title: string } | null>(null);

  const reset = useCallback(() => {
    const current = notification.current;
    if (current && document.title === current.title) document.title = current.original;
    notification.current = null;
  }, []);

  const notify = useCallback((label: string) => {
    if (!mounted.current) return;
    reset();
    const original = document.title;
    const title = original ? `✓ ${label} – ${original}` : `✓ ${label}`;
    notification.current = { original, title };
    document.title = title;
  }, [reset]);

  useEffect(() => {
    mounted.current = true;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") reset();
    };
    window.addEventListener("focus", reset);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      mounted.current = false;
      window.removeEventListener("focus", reset);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reset();
    };
  }, [reset]);

  return { notify, reset };
}
