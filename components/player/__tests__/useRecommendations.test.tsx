import { act, renderHook, waitFor } from '@testing-library/react';
import { useRecommendations } from '../useRecommendations';

const items = [{ id: 'next-one', title: 'Forest walk', reason: 'same-actor', thumbnailUrl: '/api/catalog/thumbnails/next-one' }];
beforeEach(() => { globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items }) }); });
it('prepares once at two minutes remaining, retains the choice after seeking back, and does not fetch at the end', async () => {
  const { result, rerender } = renderHook(({ time }) => useRecommendations('current', time, 300, true), { initialProps: { time: 179 } });
  expect(fetch).not.toHaveBeenCalled();
  rerender({ time: 180 });
  await waitFor(() => expect(result.current).toEqual(items));
  expect(fetch).toHaveBeenCalledTimes(1);
  rerender({ time: 0 }); rerender({ time: 300 });
  expect(fetch).toHaveBeenCalledTimes(1); expect(result.current).toEqual(items);
});
it('prepares short videos as soon as duration is available', async () => {
  const { rerender } = renderHook(({ duration }) => useRecommendations('short', 0, duration, true), { initialProps: { duration: 0 } });
  expect(fetch).not.toHaveBeenCalled(); rerender({ duration: 60 });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
});
it('does not prepare suggestions in manual categorization mode', () => {
  renderHook(() => useRecommendations('current', 100, 120, false));
  expect(fetch).not.toHaveBeenCalled();
});
it('cancels a stale request when the active video changes', async () => {
  let resolveFirst!: (response: Response) => void;
  jest.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }) as Promise<Response>);
  const { result, rerender } = renderHook(({ id, time }) => useRecommendations(id, time, 300, true), { initialProps: { id: 'first', time: 180 } });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  const signal = jest.mocked(fetch).mock.calls[0][1]?.signal;
  rerender({ id: 'second', time: 0 });
  expect(signal?.aborted).toBe(true);
  await act(async () => { resolveFirst({ ok: true, json: async () => ({ items }) } as Response); });
  expect(result.current).toEqual([]);
  rerender({ id: 'second', time: 180 });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
});
it('handles an unavailable endpoint without starting another request at video end', async () => {
  jest.mocked(fetch).mockRejectedValue(new Error('offline'));
  const { result, rerender } = renderHook(({ time }) => useRecommendations('current', time, 300, true), { initialProps: { time: 180 } });
  await act(async () => undefined);
  rerender({ time: 300 });
  expect(fetch).toHaveBeenCalledTimes(1); expect(result.current).toEqual([]);
});
