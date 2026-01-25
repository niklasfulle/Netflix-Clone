import { renderHook } from '@testing-library/react';
import getProfils from '../getProfils';
import useSWR from 'swr';

jest.mock('swr');

describe('getProfils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return profils data', () => {
    const mockProfils = [
      { id: '1', name: 'Profile 1', image: 'image1.jpg' },
      { id: '2', name: 'Profile 2', image: 'image2.jpg' },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockProfils,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => getProfils());

    expect(result.current.data).toEqual(mockProfils);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle loading state', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => getProfils());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch profils');

    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
    });

    const { result } = renderHook(() => getProfils());

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);
  });

  it('should call useSWR with correct endpoint and options', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => getProfils());

    expect(useSWR).toHaveBeenCalledWith(
      '/api/profil',
      expect.any(Function),
      expect.objectContaining({
        revalidateIfStale: true,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      })
    );
  });

  it('should return single profil', () => {
    const mockProfil = { id: '1', name: 'Profile 1', image: 'image1.jpg' };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockProfil,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => getProfils());

    expect(result.current.data).toEqual(mockProfil);
  });
});
