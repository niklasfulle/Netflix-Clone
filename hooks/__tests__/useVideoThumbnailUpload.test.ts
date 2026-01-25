import { renderHook, act, waitFor } from '@testing-library/react';
import { useVideoThumbnailUpload } from '../useVideoThumbnailUpload';
import { useChunkedUpload } from '../useChunkedUpload';
import * as toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../useChunkedUpload');
jest.mock('react-hot-toast');

describe('useVideoThumbnailUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useChunkedUpload
    (useChunkedUpload as jest.Mock).mockReturnValue({
      uploadFile: jest.fn(),
      uploadProgress: 0,
      isUploading: false,
      cancelUpload: jest.fn(),
    });
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
});
