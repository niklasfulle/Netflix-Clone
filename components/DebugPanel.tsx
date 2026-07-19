"use client";

import { useEffect, useState } from 'react';

import {
  DEBUG_EVENT,
  DebugEntry,
  clearDebugEntries,
  disableDebug,
  getDebugPath,
  initializeDebugAccess,
  readDebugEntries,
  recordDebug,
} from '@/lib/debug';

interface DebugPanelProps {
  adminAllowed: boolean;
}

function describeClick(target: EventTarget | null): Record<string, unknown> {
  const element = target instanceof Element ? target.closest('button, a, input, select, video') : null;
  if (!element) return { element: target instanceof Element ? target.tagName.toLowerCase() : 'unknown' };

  return {
    element: element.tagName.toLowerCase(),
    label: (
      element.getAttribute('aria-label')
      || element.getAttribute('title')
      || element.textContent
      || ''
    ).trim().slice(0, 120),
    path: element instanceof HTMLAnchorElement ? getDebugPath(element.href) : undefined,
  };
}

export default function DebugPanel({ adminAllowed }: DebugPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const debugEnabled = initializeDebugAccess(adminAllowed);
    setEnabled(debugEnabled);
    if (!debugEnabled) return;

    recordDebug('debug_started', {
      path: getDebugPath(window.location.href),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine,
    });
    setEntries(readDebugEntries());

    const handleEntry = (event: Event) => {
      const entry = (event as CustomEvent<DebugEntry>).detail;
      setEntries((current) => [...current, entry].slice(-100));
    };
    const handleError = (event: ErrorEvent) => {
      recordDebug('javascript_error', {
        message: event.message,
        source: event.filename ? getDebugPath(event.filename) : undefined,
        line: event.lineno,
        column: event.colno,
      });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      recordDebug('unhandled_rejection', { reason: event.reason });
    };
    const handleClick = (event: MouseEvent) => {
      recordDebug('ui_click', describeClick(event.target));
    };
    const handleOnline = () => recordDebug('network_online');
    const handleOffline = () => recordDebug('network_offline');
    const handleVisibility = () => recordDebug('visibility_changed', {
      state: document.visibilityState,
    });
    let lastLocation = window.location.href;
    const navigationTimer = window.setInterval(() => {
      if (window.location.href !== lastLocation) {
        const previousPath = getDebugPath(lastLocation);
        lastLocation = window.location.href;
        recordDebug('navigation', {
          from: previousPath,
          to: getDebugPath(lastLocation),
        });
      }
    }, 250);

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof window.fetch>) => {
      const startedAt = performance.now();
      const path = getDebugPath(args[0]);
      const method = args[1]?.method || (
        typeof Request !== 'undefined' && args[0] instanceof Request
          ? args[0].method
          : 'GET'
      );
      recordDebug('request_started', { method, path });
      try {
        const response = await originalFetch(...args);
        recordDebug('request_completed', {
          method,
          path,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
        });
        return response;
      } catch (error) {
        recordDebug('request_failed', {
          method,
          path,
          durationMs: Math.round(performance.now() - startedAt),
          error,
        });
        throw error;
      }
    };

    window.addEventListener(DEBUG_EVENT, handleEntry);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.fetch = originalFetch;
      window.clearInterval(navigationTimer);
      window.removeEventListener(DEBUG_EVENT, handleEntry);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [adminAllowed]);

  if (!enabled) return null;

  const copyEntries = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(entries, null, 2));
      recordDebug('debug_log_copied', { entries: entries.length });
    } catch (error) {
      recordDebug('debug_log_copy_failed', { error });
    }
  };

  const closePanel = () => {
    disableDebug();
    const url = new URL(window.location.href);
    url.searchParams.delete('debug');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    setEntries([]);
    setEnabled(false);
  };

  return (
    <aside className="fixed inset-x-2 bottom-2 z-[100] max-h-72 overflow-auto rounded border border-red-500 bg-black/95 p-3 font-mono text-[11px] text-white shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between gap-2 bg-black pb-2">
        <strong>Debug · Admin</strong>
        <div className="flex gap-2">
          <button type="button" className="rounded border border-white px-2 py-1" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? 'Open' : 'Minimize'}
          </button>
          <button type="button" className="rounded border border-white px-2 py-1" onClick={copyEntries}>Copy</button>
          <button
            type="button"
            className="rounded border border-white px-2 py-1"
            onClick={() => {
              clearDebugEntries();
              setEntries([]);
            }}
          >
            Clear
          </button>
          <button type="button" className="rounded border border-red-500 px-2 py-1" onClick={closePanel}>Close</button>
        </div>
      </div>
      {!collapsed && (
        <ol aria-live="polite" className="space-y-1">
          {entries.length === 0 && <li>Waiting for diagnostic events…</li>}
          {entries.map((entry, index) => (
            <li key={`${entry.timestamp}-${index}`}>
              {entry.timestamp.slice(11, 23)} {entry.stage}
              {entry.details ? ` ${JSON.stringify(entry.details)}` : ''}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
