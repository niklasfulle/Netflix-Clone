import { act, renderHook, waitFor } from '@testing-library/react';
import { useBillboardVideoAvailability } from '../useBillboardVideoAvailability';

const originalFetch = global.fetch;
const availableResponse = { ok: true, headers: new Map([['x-video-available', 'true']]) } as unknown as Response;
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { global.fetch = originalFetch; });

it('keeps previews disabled when there is no eligible title', () => {
  const { result, rerender } = renderHook(({ id, enabled }) => useBillboardVideoAvailability(id, enabled), { initialProps: { id: undefined as string | undefined, enabled: true } });
  expect(result.current).toBe(false);
  rerender({ id: 'movie', enabled: false });
  expect(global.fetch).not.toHaveBeenCalled();
});

it('does not revive a previous preview when an aborted request finishes late', async () => {
  let finish!: (response: Response) => void;
  jest.mocked(global.fetch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const { result, rerender } = renderHook(({ enabled }) => useBillboardVideoAvailability('movie', enabled), { initialProps: { enabled: true } });
  const options = jest.mocked(global.fetch).mock.calls[0][1]!;
  rerender({ enabled: false });
  expect(options.signal?.aborted).toBe(true);
  await act(async () => { finish(availableResponse); });
  expect(result.current).toBe(false);
});

it('falls back to artwork when the availability request fails', async () => {
  jest.mocked(global.fetch).mockRejectedValue(new Error('Network unavailable'));
  const { result } = renderHook(() => useBillboardVideoAvailability('movie', true));
  await act(async () => { await Promise.resolve(); });
  expect(result.current).toBe(false);
});

it('ignores a failed request after preview loading has been disabled', async () => {
  let reject!: (error: Error) => void;
  jest.mocked(global.fetch).mockImplementation(() => new Promise((_resolve, fail) => { reject = fail; }));
  const { result, rerender } = renderHook(({ enabled }) => useBillboardVideoAvailability('movie', enabled), { initialProps: { enabled: true } });
  rerender({ enabled: false });
  await act(async () => { reject(new Error('Aborted fetch')); });
  expect(result.current).toBe(false);
});

it('enables a preview only after a successful availability response', async () => {
  jest.mocked(global.fetch).mockResolvedValue(availableResponse);
  const { result } = renderHook(() => useBillboardVideoAvailability('movie', true));
  await waitFor(() => expect(result.current).toBe(true));
});
