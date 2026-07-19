import {
  DEBUG_ACTIVE_STORAGE_KEY,
  DEBUG_EVENT,
  DEBUG_STORAGE_KEY,
  clearDebugEntries,
  getDebugPath,
  initializeDebugAccess,
  isDebugEnabled,
  readDebugEntries,
  recordDebug,
} from '@/lib/debug';

describe('global debug mode', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/series');
    sessionStorage.clear();
    initializeDebugAccess(false);
  });

  test('can only be enabled for an administrator with debug=1', () => {
    expect(initializeDebugAccess(false, '?debug=1')).toBe(false);
    expect(isDebugEnabled('?debug=1')).toBe(false);

    expect(initializeDebugAccess(true, '?debug=1')).toBe(true);
    expect(isDebugEnabled()).toBe(true);
  });

  test('stays active for the admin during navigation in the same tab', () => {
    initializeDebugAccess(true, '?debug=1');
    window.history.replaceState({}, '', '/movies');

    expect(sessionStorage.getItem(DEBUG_ACTIVE_STORAGE_KEY)).toBe('1');
    expect(isDebugEnabled()).toBe(true);
  });

  test('revokes and clears debug data for non-admin users', () => {
    initializeDebugAccess(true, '?debug=1');
    recordDebug('request_completed', { status: 200 });

    initializeDebugAccess(false, '?debug=1');

    expect(sessionStorage.getItem(DEBUG_ACTIVE_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(DEBUG_STORAGE_KEY)).toBeNull();
  });

  test('records, sanitizes, and emits diagnostic entries', () => {
    initializeDebugAccess(true, '?debug=1');
    const listener = jest.fn();
    window.addEventListener(DEBUG_EVENT, listener);

    recordDebug('request_completed', {
      status: 200,
      response: 'x'.repeat(1500),
    });

    expect(readDebugEntries()).toEqual([
      expect.objectContaining({
        stage: 'request_completed',
        details: expect.objectContaining({ status: 200 }),
      }),
    ]);
    expect(String(readDebugEntries()[0].details?.response).length).toBeLessThan(1100);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(DEBUG_EVENT, listener);
  });

  test('clears persisted diagnostic entries', () => {
    initializeDebugAccess(true, '?debug=1');
    recordDebug('ui_click');
    clearDebugEntries();
    expect(readDebugEntries()).toEqual([]);
  });

  test('redacts query values from recorded URLs', () => {
    expect(getDebugPath('https://example.com/api/search?token=secret&q=test')).toBe(
      '/api/search?token&q',
    );
  });
});
