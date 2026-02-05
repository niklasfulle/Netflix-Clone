import { renderHook } from '@testing-library/react';
import useBillboard from '../useBillborad';
import useSWR from 'swr';

jest.mock('swr');

describe('useBillboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return billboard data', () => {
    const mockBillboardData = {
      id: '1',
      title: 'Random Movie',
      image: 'image.jpg',
      description: 'Description',
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockBillboardData,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useBillboard());

    expect(result.current.data).toEqual(mockBillboardData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useBillboard());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch billboard');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => useBillboard());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);
  });

  it('should call useSWR with correct endpoint pattern and revalidation options', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useBillboard());

    const callArgs = (useSWR as jest.Mock).mock.calls[0];
    const endpoint = callArgs[0];
    const options = callArgs[2];

    // Prüfe dass der Endpoint das richtige Muster hat
    expect(endpoint).toMatch(/^\/api\/random\?context=billboard&t=\d+$/);
    expect(options.revalidateIfStale).toBe(false);
    expect(options.revalidateOnFocus).toBe(false);
    expect(options.revalidateOnReconnect).toBe(false);
  });

  it('should disable revalidation and deduping to keep data fresh on each mount', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: { id: '1' },
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useBillboard());

    const callOptions = (useSWR as jest.Mock).mock.calls[0][2];
    expect(callOptions.revalidateIfStale).toBe(false);
    expect(callOptions.revalidateOnFocus).toBe(false);
    expect(callOptions.revalidateOnReconnect).toBe(false);
  });

  it('should generate unique key with timestamp on each mount', async () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: { id: '1' },
      error: undefined,
      isLoading: false,
    });

    const { unmount } = renderHook(() => useBillboard());
    const firstKey = (useSWR as jest.Mock).mock.calls[0][0];
    unmount();

    // Kleine Verzögerung um sicherzustellen, dass Date.now() unterschiedlich ist
    await new Promise(resolve => setTimeout(resolve, 5));

    jest.clearAllMocks();
    renderHook(() => useBillboard());
    const secondKey = (useSWR as jest.Mock).mock.calls[0][0];

    // Die Keys sollten unterschiedlich sein (verschiedene Timestamps)
    expect(firstKey).toMatch(/\/api\/random\?context=billboard&t=\d+/);
    expect(secondKey).toMatch(/\/api\/random\?context=billboard&t=\d+/);
    expect(firstKey).not.toBe(secondKey);
  });
});
