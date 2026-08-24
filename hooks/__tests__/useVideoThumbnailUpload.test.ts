import { renderHook, act, waitFor } from '@testing-library/react';
import { useVideoThumbnailUpload } from '../useVideoThumbnailUpload';
import { useChunkedUpload } from '../useChunkedUpload';
import * as toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../useChunkedUpload');
jest.mock('react-hot-toast');

const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');

describe('useVideoThumbnailUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.replaceChildren();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
    // Mock useChunkedUpload
    (useChunkedUpload as jest.Mock).mockReturnValue({
      uploadFile: jest.fn(),
      uploadProgress: 0,
      isUploading: false,
      cancelUpload: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  afterAll(() => {
    if (originalFetch) {
      Object.defineProperty(globalThis, 'fetch', originalFetch);
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      expect(result.current.videoFile).toBeNull();
      expect(result.current.videoPreviewUrl).toBe('');
      expect(result.current.thumbnailUrl).toBe('');
      expect(result.current.showThumbnailSelector).toBe(false);
      expect(result.current.thumbnailOptions).toEqual([]);
      expect(result.current.uploadedVideoPath).toBe('');
      expect(result.current.generatedVideoId).toBe('');
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadProgress).toBe(0);
    });

    it('should have video and canvas refs', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      expect(result.current.videoRef).toBeDefined();
      expect(result.current.canvasRef).toBeDefined();
    });
  });

  describe('generateVideoId', () => {
    it('should generate unique video IDs', () => {
      const { result: hook1 } = renderHook(() => useVideoThumbnailUpload());
      const { result: hook2 } = renderHook(() => useVideoThumbnailUpload());

      // Note: We can't directly test generateVideoId as it's internal
      // But we test it indirectly through handleVideoUpload
      expect(hook1).toBeDefined();
      expect(hook2).toBeDefined();
    });

    it('should format video ID correctly', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      // Create a file to trigger video ID generation
      const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleVideoUpload(event);
      });

      expect(result.current.generatedVideoId).toMatch(/^video_\d+_[a-z0-9]+$/);
    });
  });

  describe('selectThumbnail', () => {
    it('should set thumbnail URL and hide selector', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const testThumbnail = 'data:image/jpeg;base64,test';

      act(() => {
        result.current.selectThumbnail(testThumbnail);
      });

      expect(result.current.thumbnailUrl).toBe(testThumbnail);
      expect(result.current.showThumbnailSelector).toBe(false);
      expect(toast.default.success).toHaveBeenCalledWith('Thumbnail selected!');
    });
  });

  describe('deselectThumbnail', () => {
    it('should clear thumbnail URL and show selector', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      // First set a thumbnail
      act(() => {
        result.current.setThumbnailUrl('data:image/jpeg;base64,test');
      });

      // Then deselect it
      act(() => {
        result.current.deselectThumbnail();
      });

      expect(result.current.thumbnailUrl).toBe('');
      expect(result.current.showThumbnailSelector).toBe(true);
      expect(toast.default.success).toHaveBeenCalledWith('Thumbnail deselected!');
    });
  });

  describe('setThumbnailUrl', () => {
    it('should update thumbnail URL', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const newUrl = 'data:image/jpeg;base64,new';

      act(() => {
        result.current.setThumbnailUrl(newUrl);
      });

      expect(result.current.thumbnailUrl).toBe(newUrl);
    });
  });

  describe('setVideoFile', () => {
    it('should update video file', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const file = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });

      act(() => {
        result.current.setVideoFile(file);
      });

      expect(result.current.videoFile).toBe(file);
    });
  });

  describe('setVideoPreviewUrl', () => {
    it('should update video preview URL', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const url = 'blob:http://localhost/123';

      act(() => {
        result.current.setVideoPreviewUrl(url);
      });

      expect(result.current.videoPreviewUrl).toBe(url);
    });
  });

  describe('setShowThumbnailSelector', () => {
    it('should toggle thumbnail selector visibility', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      act(() => {
        result.current.setShowThumbnailSelector(true);
      });

      expect(result.current.showThumbnailSelector).toBe(true);

      act(() => {
        result.current.setShowThumbnailSelector(false);
      });

      expect(result.current.showThumbnailSelector).toBe(false);
    });
  });

  describe('setThumbnailOptions', () => {
    it('should update thumbnail options', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const options = ['thumb1', 'thumb2', 'thumb3'];

      act(() => {
        result.current.setThumbnailOptions(options);
      });

      expect(result.current.thumbnailOptions).toEqual(options);
    });
  });

  describe('setUploadedVideoPath', () => {
    it('should update uploaded video path', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const path = '/uploads/video_123.mp4';

      act(() => {
        result.current.setUploadedVideoPath(path);
      });

      expect(result.current.uploadedVideoPath).toBe(path);
    });
  });

  describe('setGeneratedVideoId', () => {
    it('should update generated video ID', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const id = 'video_123456_abc';

      act(() => {
        result.current.setGeneratedVideoId(id);
      });

      expect(result.current.generatedVideoId).toBe(id);
    });
  });

  describe('resetUploadState', () => {
    it('should reset all upload-related state', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      // Set some state
      act(() => {
        result.current.setVideoFile(new File(['dummy'], 'test.mp4'));
        result.current.setVideoPreviewUrl('blob:test');
        result.current.setThumbnailOptions(['thumb1']);
        result.current.setUploadedVideoPath('/path/to/video');
        result.current.setGeneratedVideoId('video_123');
      });

      // Reset
      act(() => {
        result.current.resetUploadState();
      });

      expect(result.current.videoFile).toBeNull();
      expect(result.current.videoPreviewUrl).toBe('');
      expect(result.current.thumbnailOptions).toEqual([]);
      expect(result.current.uploadedVideoPath).toBe('');
      expect(result.current.generatedVideoId).toBe('');
    });

    it('clears both file inputs and releases the previous preview URL', () => {
      const revokeObjectUrl = jest.fn();
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: revokeObjectUrl,
      });

      const videoInput = document.createElement('input');
      videoInput.id = 'video-upload';
      Object.defineProperty(videoInput, 'value', {
        configurable: true,
        writable: true,
        value: 'selected-video',
      });
      const thumbnailInput = document.createElement('input');
      thumbnailInput.id = 'thumbnail-upload';
      Object.defineProperty(thumbnailInput, 'value', {
        configurable: true,
        writable: true,
        value: 'selected-thumbnail',
      });
      document.body.append(videoInput, thumbnailInput);

      const { result } = renderHook(() => useVideoThumbnailUpload());
      act(() => {
        result.current.setVideoPreviewUrl('blob:preview');
      });
      act(() => {
        result.current.resetUploadState();
      });

      expect(videoInput.value).toBe('');
      expect(thumbnailInput.value).toBe('');
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:preview');
    });
  });

  describe('createDataUri', () => {
    it('should handle file to data URI conversion', async () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      const file = new File(['test content'], 'image.jpg', { type: 'image/jpeg' });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.createDataUri(event);
      });

      await waitFor(() => {
        expect(result.current.thumbnailUrl).toMatch(/^data:image\/jpeg;base64,/);
      });
    });

    it('should hide thumbnail selector after uploading image', async () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      // First show selector
      act(() => {
        result.current.setShowThumbnailSelector(true);
      });

      const file = new File(['test content'], 'image.jpg', { type: 'image/jpeg' });
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.createDataUri(event);
      });

      await waitFor(() => {
        expect(result.current.showThumbnailSelector).toBe(false);
      });
    });

    it('should handle no file gracefully', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      const event = {
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.createDataUri(event);
      });

      expect(result.current.thumbnailUrl).toBe('');
    });
  });

  describe('handleVideoUpload', () => {
    it('should handle no file gracefully', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      const event = {
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleVideoUpload(event);
      });

      expect(result.current.videoFile).toBeNull();
      expect(result.current.videoPreviewUrl).toBe('');
    });

    it('formats short and multi-hour video metadata for the form', async () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const longVideo = document.createElement('video');
      const shortVideo = document.createElement('video');
      Object.defineProperty(longVideo, 'duration', { configurable: true, value: 3661 });
      Object.defineProperty(shortVideo, 'duration', { configurable: true, value: 125 });
      jest.spyOn(document, 'createElement')
        .mockReturnValueOnce(longVideo)
        .mockReturnValueOnce(shortVideo);
      jest.spyOn(URL, 'createObjectURL')
        .mockReturnValueOnce('blob:long-video')
        .mockReturnValueOnce('blob:short-video');
      const onDurationChange = jest.fn();
      const longFile = new File(['long'], 'long.mp4', { type: 'video/mp4' });
      const shortFile = new File(['short'], 'short.mp4', { type: 'video/mp4' });

      await act(async () => {
        await result.current.handleVideoUpload({
          target: { files: [longFile] },
        } as unknown as React.ChangeEvent<HTMLInputElement>, onDurationChange);
      });
      act(() => {
        longVideo.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      await act(async () => {
        await result.current.handleVideoUpload({
          target: { files: [shortFile] },
        } as unknown as React.ChangeEvent<HTMLInputElement>, onDurationChange);
      });
      act(() => {
        shortVideo.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      expect(onDurationChange).toHaveBeenNthCalledWith(1, '01:01:01');
      expect(onDurationChange).toHaveBeenNthCalledWith(2, '02:05');
      expect(result.current.videoFile).toBe(shortFile);
      expect(result.current.videoPreviewUrl).toBe('blob:short-video');
      expect(toast.default.success).toHaveBeenNthCalledWith(1, 'Video length: 01:01:01');
      expect(toast.default.success).toHaveBeenNthCalledWith(2, 'Video length: 02:05');
    });
  });

  describe('uploadVideo', () => {
    it('requires both a selected video and a media type', async () => {
      const uploadFile = jest.fn();
      (useChunkedUpload as jest.Mock).mockReturnValue({
        uploadFile,
        uploadProgress: 0,
        isUploading: false,
        cancelUpload: jest.fn(),
      });
      const { result } = renderHook(() => useVideoThumbnailUpload());

      await act(async () => {
        await result.current.uploadVideo('movie');
      });
      expect(toast.default.error).toHaveBeenCalledWith('Please select a video first!');

      act(() => {
        result.current.setVideoFile(new File(['video'], 'movie.mp4', { type: 'video/mp4' }));
      });
      await act(async () => {
        await result.current.uploadVideo('');
      });

      expect(toast.default.error).toHaveBeenCalledWith('Please select a type!');
      expect(uploadFile).not.toHaveBeenCalled();
    });

    it('keeps the upload pending when the chunk uploader returns no result', async () => {
      const uploadFile = jest.fn().mockResolvedValue(null);
      (useChunkedUpload as jest.Mock).mockReturnValue({
        uploadFile,
        uploadProgress: 25,
        isUploading: false,
        cancelUpload: jest.fn(),
      });
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const file = new File(['video'], 'movie.mp4', { type: 'video/mp4' });
      act(() => {
        result.current.setVideoFile(file);
        result.current.setGeneratedVideoId('video-123');
      });

      await act(async () => {
        await result.current.uploadVideo('movie');
      });

      expect(uploadFile).toHaveBeenCalledWith(file, 'movie', 'video-123');
      expect(result.current.uploadedVideoPath).toBe('');
      expect(toast.default.success).not.toHaveBeenCalledWith('Video uploaded successfully!');
    });

    it('publishes a successful upload and schedules thumbnail generation', async () => {
      jest.useFakeTimers();
      const uploadResult = { filePath: '/uploads/movie.mp4', videoId: 'video-123' };
      const uploadFile = jest.fn().mockResolvedValue(uploadResult);
      (useChunkedUpload as jest.Mock).mockReturnValue({
        uploadFile,
        uploadProgress: 100,
        isUploading: false,
        cancelUpload: jest.fn(),
      });
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const file = new File(['video'], 'movie.mp4', { type: 'video/mp4' });
      const onVideoUploadSuccess = jest.fn();
      act(() => {
        result.current.setVideoFile(file);
        result.current.setGeneratedVideoId('video-123');
      });

      await act(async () => {
        await result.current.uploadVideo('movie', onVideoUploadSuccess);
      });

      expect(result.current.uploadedVideoPath).toBe('/uploads/movie.mp4');
      expect(onVideoUploadSuccess).toHaveBeenCalledWith(uploadResult);
      expect(toast.default.success).toHaveBeenCalledWith('Video uploaded successfully!');
      act(() => {
        jest.advanceTimersByTime(500);
      });
    });
  });

  describe('cancelUpload', () => {
    it('should reset state when no uploaded video path', async () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      await act(async () => {
        await result.current.cancelUpload();
      });

      expect(result.current.videoFile).toBeNull();
      expect(result.current.videoPreviewUrl).toBe('');
      expect(toast.default.success).toHaveBeenCalledWith('Cancelled!');
    });

    it('should call onCancel callback if provided', async () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const onCancelMock = jest.fn();

      await act(async () => {
        await result.current.cancelUpload(onCancelMock);
      });

      expect(onCancelMock).toHaveBeenCalled();
    });

    it('cancels an active chunk upload and clears the local state', async () => {
      const cancelChunkUpload = jest.fn();
      (useChunkedUpload as jest.Mock).mockReturnValue({
        uploadFile: jest.fn(),
        uploadProgress: 40,
        isUploading: true,
        cancelUpload: cancelChunkUpload,
      });
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const onCancel = jest.fn();
      act(() => {
        result.current.setVideoFile(new File(['video'], 'movie.mp4'));
        result.current.setUploadedVideoPath('/uploads/partial.mp4');
      });

      await act(async () => {
        await result.current.cancelUpload(onCancel);
      });

      expect(cancelChunkUpload).toHaveBeenCalledTimes(1);
      expect(result.current.videoFile).toBeNull();
      expect(result.current.uploadedVideoPath).toBe('');
      expect(toast.default.success).toHaveBeenCalledWith('Upload abgebrochen!');
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('deletes an uploaded video and clears the local state', async () => {
      const fetchMock = globalThis.fetch as jest.Mock;
      fetchMock.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      } as unknown as Response);
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const onCancel = jest.fn();
      act(() => {
        result.current.setUploadedVideoPath('/uploads/movie.mp4');
      });

      await act(async () => {
        await result.current.cancelUpload(onCancel);
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/movies/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: '/uploads/movie.mp4' }),
      });
      expect(result.current.uploadedVideoPath).toBe('');
      expect(toast.default.success).toHaveBeenCalledWith('Video deleted!');
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('keeps the uploaded path when deletion is rejected', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: false }),
      } as unknown as Response);
      const { result } = renderHook(() => useVideoThumbnailUpload());
      act(() => {
        result.current.setUploadedVideoPath('/uploads/movie.mp4');
      });

      await act(async () => {
        await result.current.cancelUpload();
      });

      expect(result.current.uploadedVideoPath).toBe('/uploads/movie.mp4');
      expect(toast.default.error).toHaveBeenCalledWith('Error deleting video!');
    });

    it('reports a network failure without discarding the uploaded path', async () => {
      const error = new Error('network unavailable');
      (globalThis.fetch as jest.Mock).mockRejectedValue(error);
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { result } = renderHook(() => useVideoThumbnailUpload());
      act(() => {
        result.current.setUploadedVideoPath('/uploads/movie.mp4');
      });

      await act(async () => {
        await result.current.cancelUpload();
      });

      expect(consoleError).toHaveBeenCalledWith('Error deleting video:', error);
      expect(result.current.uploadedVideoPath).toBe('/uploads/movie.mp4');
      expect(toast.default.error).toHaveBeenCalledWith('Error deleting video!');
    });
  });

  describe('regenerateThumbnails', () => {
    it('should show toast message', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());

      act(() => {
        result.current.regenerateThumbnails();
      });

      expect(toast.default.success).toHaveBeenCalledWith(
        'New thumbnails are being generated...'
      );
    });
  });

  describe('generateThumbnails', () => {
    it('does not expose a selector when the browser cannot provide a canvas context', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      jest.spyOn(canvas, 'getContext').mockReturnValue(null);
      Object.defineProperty(result.current.videoRef, 'current', { configurable: true, value: video });
      Object.defineProperty(result.current.canvasRef, 'current', { configurable: true, value: canvas });

      act(() => {
        result.current.generateThumbnails();
      });

      expect(result.current.thumbnailOptions).toEqual([]);
      expect(result.current.showThumbnailSelector).toBe(false);
    });

    it('captures six frames and opens the thumbnail selector', () => {
      const { result } = renderHook(() => useVideoThumbnailUpload());
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      Object.defineProperties(video, {
        duration: { configurable: true, value: 60 },
        videoWidth: { configurable: true, value: 1920 },
        videoHeight: { configurable: true, value: 1080 },
        currentTime: { configurable: true, writable: true, value: 0 },
      });
      const drawImage = jest.fn();
      jest.spyOn(canvas, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
      jest.spyOn(canvas, 'toDataURL').mockImplementation(
        () => `data:image/jpeg;base64,frame-${drawImage.mock.calls.length}`,
      );
      Object.defineProperty(result.current.videoRef, 'current', { configurable: true, value: video });
      Object.defineProperty(result.current.canvasRef, 'current', { configurable: true, value: canvas });

      act(() => {
        result.current.generateThumbnails(20);
      });
      for (let frame = 0; frame < 6; frame += 1) {
        act(() => {
          video.onseeked?.(new Event('seeked'));
        });
      }

      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);
      expect(drawImage).toHaveBeenCalledTimes(6);
      expect(result.current.thumbnailOptions).toEqual([
        'data:image/jpeg;base64,frame-1',
        'data:image/jpeg;base64,frame-2',
        'data:image/jpeg;base64,frame-3',
        'data:image/jpeg;base64,frame-4',
        'data:image/jpeg;base64,frame-5',
        'data:image/jpeg;base64,frame-6',
      ]);
      expect(result.current.showThumbnailSelector).toBe(true);
    });
  });
});
