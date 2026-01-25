import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import useProfilImgsApi from '../useProfilImgsApi';

jest.mock('swr');

describe('useProfilImgsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return profil images data when loaded', () => {
    const mockImages = [
      { id: '1', url: '/img1.jpg', name: 'Image 1' },
      { id: '2', url: '/img2.jpg', name: 'Image 2' },
    ];
    const mockMutate = jest.fn();
    (useSWR as jest.Mock).mockReturnValue({
      data: mockImages,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useProfilImgsApi());

    expect(result.current.data).toEqual(mockImages);
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

    const { result } = renderHook(() => useProfilImgsApi());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch profil images');
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useProfilImgsApi());

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

    const { result } = renderHook(() => useProfilImgsApi());

    expect(result.current.mutate).toBe(mockMutate);
  });

  it('should call SWR with correct endpoint', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    renderHook(() => useProfilImgsApi());

    expect(useSWR).toHaveBeenCalledWith('/api/profilimg', expect.any(Function));
  });

  it('should return empty array when data is undefined', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useProfilImgsApi());

    expect(result.current.data).toBeUndefined();
  });
});
