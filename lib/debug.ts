export const DEBUG_QUERY = 'debug=1';
export const DEBUG_STORAGE_KEY = 'netflix-debug-entries';
export const DEBUG_ACTIVE_STORAGE_KEY = 'netflix-debug-active';
export const DEBUG_EVENT = 'netflix:debug';

const MAX_ENTRIES = 100;
const MAX_STRING_LENGTH = 1000;

let adminAuthorized = false;

export interface DebugEntry {
  timestamp: string;
  stage: string;
  details?: Record<string, unknown>;
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Debug mode must never affect normal application behavior.
  }
}

export function initializeDebugAccess(
  isAdmin: boolean,
  search?: string,
): boolean {
  if (globalThis.window === undefined) return false;

  adminAuthorized = isAdmin;
  if (!isAdmin) {
    safeRemove(DEBUG_ACTIVE_STORAGE_KEY);
    safeRemove(DEBUG_STORAGE_KEY);
    return false;
  }

  const query = search ?? globalThis.location.search;
  const requestedState = new URLSearchParams(query).get('debug');

  try {
    if (requestedState === '1') {
      sessionStorage.setItem(DEBUG_ACTIVE_STORAGE_KEY, '1');
    } else if (requestedState === '0') {
      sessionStorage.removeItem(DEBUG_ACTIVE_STORAGE_KEY);
    }
  } catch {
    return requestedState === '1';
  }

  return isDebugEnabled(query);
}

export function isDebugEnabled(search?: string): boolean {
  if (globalThis.window === undefined || !adminAuthorized) return false;

  const query = search ?? globalThis.location.search;
  const requestedState = new URLSearchParams(query).get('debug');
  if (requestedState === '1') return true;
  if (requestedState === '0') return false;

  try {
    return sessionStorage.getItem(DEBUG_ACTIVE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…`
      : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return value;
  }
  if (value instanceof Error) {
    return { name: value.name, message: sanitizeValue(value.message) };
  }
  if (depth >= 3) return '[nested value]';
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 20)
        .map(([key, item]) => [key, sanitizeValue(item, depth + 1)]),
    );
  }
  if (typeof value === 'symbol') return value.description ?? '[symbol]';
  if (typeof value === 'function') return value.name || '[function]';
  if (typeof value === 'bigint') return value.toString();
  return '[unsupported value]';
}

export function readDebugEntries(): DebugEntry[] {
  if (globalThis.window === undefined || !adminAuthorized) return [];

  try {
    const stored = sessionStorage.getItem(DEBUG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function recordDebug(
  stage: string,
  details?: Record<string, unknown>,
): void {
  if (!isDebugEnabled()) return;

  const entry: DebugEntry = {
    timestamp: new Date().toISOString(),
    stage,
    details: details
      ? (sanitizeValue(details) as Record<string, unknown>)
      : undefined,
  };

  try {
    const entries = [...readDebugEntries(), entry].slice(-MAX_ENTRIES);
    sessionStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // The visible panel still receives the event if browser storage is full.
  }

  globalThis.dispatchEvent(new CustomEvent(DEBUG_EVENT, { detail: entry }));
}

export function clearDebugEntries(): void {
  if (globalThis.window === undefined || !adminAuthorized) return;
  safeRemove(DEBUG_STORAGE_KEY);
}

export function disableDebug(): void {
  if (globalThis.window === undefined) return;
  safeRemove(DEBUG_ACTIVE_STORAGE_KEY);
  safeRemove(DEBUG_STORAGE_KEY);
}

export function getDebugPath(input: RequestInfo | URL): string {
  try {
    const raw = typeof input === 'string' || input instanceof URL
      ? input
      : input.url;
    const url = new URL(raw, globalThis.location.origin);
    const parameterNames = Array.from(new Set(url.searchParams.keys()));
    const query = parameterNames.length ? `?${parameterNames.join('&')}` : '';
    return `${url.pathname}${query}`;
  } catch {
    return '[unknown URL]';
  }
}
