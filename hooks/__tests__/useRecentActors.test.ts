import { renderHook } from '@testing-library/react';
import { useRecentActors } from '../useRecentActors';

const storageKey = 'netflix:recent-actors:v1';

beforeEach(() => { localStorage.clear(); });
afterEach(() => { jest.restoreAllMocks(); });

it('restores valid unique IDs without treating the initially loaded cast as a new selection', () => {
  localStorage.setItem(storageKey, JSON.stringify(['second', 'first', 'second', null, 12, '']));
  const { result } = renderHook(() => useRecentActors(['existing-cast']));
  expect(result.current).toEqual(['second', 'first']);
});

it('remembers the last three additions, keeps removals neutral, and promotes a reselected actor', () => {
  const { result, rerender, unmount } = renderHook(({ selected }) => useRecentActors(selected), {
    initialProps: { selected: [] as string[] },
  });
  rerender({ selected: ['first'] });
  rerender({ selected: ['first', 'second'] });
  rerender({ selected: ['first', 'second', 'third'] });
  rerender({ selected: ['first', 'second', 'third', 'fourth'] });
  expect(result.current).toEqual(['fourth', 'third', 'second']);
  rerender({ selected: ['first', 'third', 'fourth'] });
  expect(result.current).toEqual(['fourth', 'third', 'second']);
  rerender({ selected: ['first', 'third', 'fourth', 'second'] });
  expect(result.current).toEqual(['second', 'fourth', 'third']);
  expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(result.current);
  unmount();
  const restored = renderHook(() => useRecentActors([]));
  expect(restored.result.current).toEqual(['second', 'fourth', 'third']);
});

it.each(['not-json', '{}', 'null', '[null,42,""]'])('ignores malformed browser history: %s', (stored) => {
  localStorage.setItem(storageKey, stored);
  const { result } = renderHook(() => useRecentActors([]));
  expect(result.current).toEqual([]);
});

it('keeps recent selections usable when browser storage is blocked', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  const { result, rerender } = renderHook(({ selected }) => useRecentActors(selected), {
    initialProps: { selected: [] as string[] },
  });
  rerender({ selected: ['inline-created'] });
  expect(result.current).toEqual(['inline-created']);
  rerender({ selected: ['inline-created', 'second'] });
  expect(result.current).toEqual(['second', 'inline-created']);
});
