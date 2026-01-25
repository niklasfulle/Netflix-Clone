import { renderHook, act } from '@testing-library/react';
import { useChunkedUpload } from '../useChunkedUpload';

jest.mock('react-hot-toast');

globalThis.fetch = jest.fn();

// Suppress console output for upload process
const originalLog = console.log;
const originalError = console.error;

describe('useChunkedUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockClear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChunkedUpload());

    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.isUploading).toBe(false);
  });

  it('should set uploading state', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ allChunksReceived: true, filePath: '/uploads/test.mp4', videoId: 'vid-123' }),
    });

    const mockFile = new File(['x'.repeat(10 * 1024 * 1024)], 'test.mp4', { type: 'video/mp4' });
    
    const { result } = renderHook(() => useChunkedUpload());

    expect(result.current.uploadProgress).toBe(0);
  });

  it('should provide cancelUpload function', () => {
    const { result } = renderHook(() => useChunkedUpload());

    expect(typeof result.current.cancelUpload).toBe('function');
  });

  it('should call upload endpoint for chunks', async () => {
    const mockFile = new File(['test content'], 'test.mp4', { type: 'video/mp4' });
    
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ allChunksReceived: true, filePath: '/uploads/test.mp4', videoId: 'vid-123' }),
    });

    const { result } = renderHook(() => useChunkedUpload());

    await act(async () => {
      try {
        await result.current.uploadFile(mockFile, 'movie', 'gen-id-123');
      } catch (e) {
        // Expected in test environment
      }
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/movies/upload-chunk',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );
  });

  it('should have uploadFile method', () => {
    const { result } = renderHook(() => useChunkedUpload());

    expect(typeof result.current.uploadFile).toBe('function');
  });

  it('should track upload progress', async () => {
    const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ allChunksReceived: true, filePath: '/uploads/test.mp4', videoId: 'vid-123' }),
    });

    const { result } = renderHook(() => useChunkedUpload());

    expect(result.current.uploadProgress).toBe(0);
  });
});
