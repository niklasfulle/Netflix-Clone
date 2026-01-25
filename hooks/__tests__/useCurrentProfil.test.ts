import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useCurrentProfil from '../useCurrentProfil';

jest.mock('swr');

describe('useCurrentProfil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return profil data when loaded', () => {
    const mockProfil = { id: '1', name: 'Main Profile', language: 'en' };
    const mockMutate = jest.fn();
    (useSWR as jest.Mock).mockReturnValue({
      data: mockProfil,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useCurrentProfil());

    expect(result.current.data).toEqual(mockProfil);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentProfil());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch profil');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentProfil());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('should provide mutate function', () => {
    const mockMutate = jest.fn();
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useCurrentProfil());

    expect(result.current.mutate).toBe(mockMutate);
  });

  it('should call SWR with correct endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    renderHook(() => useCurrentProfil());

    expect(useSWR).toHaveBeenCalledWith('/api/current/profil', expect.any(Function));
  });
});
