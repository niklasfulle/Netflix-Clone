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

  it('should call useSWR with correct endpoint and revalidation options', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useBillboard());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/random',
      expect.any(Function),
      expect.objectContaining({
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      })
    );
  });

  it('should disable revalidation to keep data static', () => {
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
});
