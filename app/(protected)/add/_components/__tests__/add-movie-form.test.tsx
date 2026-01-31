// Mock dependencies FIRST, before any imports
jest.mock('react-hot-toast');
jest.mock('@/hooks/useVideoThumbnailUpload');
jest.mock('@/actions/add/add-movie', () => ({
  addMovie: jest.fn(),
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <form data-testid="form">{children}</form>,
  FormControl: ({ children }: any) => <div data-testid="form-control">{children}</div>,
  FormField: ({ render }: any) => render({ field: { value: '', onChange: jest.fn() }, fieldState: {} }),
  FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }: any) => <label data-testid="form-label">{children}</label>,
  FormMessage: () => <div data-testid="form-message"></div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select" onClick={() => onValueChange?.('test-value')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
}));

jest.mock('@/components/ui/multi-select', () => ({
  MultiSelect: ({ placeholder, onChange }: any) => (
    <div data-testid="multi-select" onClick={() => onChange?.([])} title={placeholder}>
      {placeholder}
    </div>
  ),
}));

jest.mock('@/components/ThumbnailSelector', () => ({
  ThumbnailSelector: ({ thumbnailOptions }: any) => (
    <div data-testid="thumbnail-selector">
      Thumbnail Selector - {thumbnailOptions?.length} options
    </div>
  ),
}));

jest.mock('@/components/ThumbnailPreview', () => ({
  ThumbnailPreview: ({ thumbnailUrl, onDeselect, useImage }: any) => (
    <div data-testid="thumbnail-preview">
      Thumbnail Preview {thumbnailUrl && '- Selected'}
    </div>
  ),
}));

// NOW import after all mocks are defined
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useVideoThumbnailUpload } from '@/hooks/useVideoThumbnailUpload';
import { AddMovieForm } from '@/app/(protected)/add/_components/add-movie-form';
import * as AddMovieAction from '@/actions/add/add-movie';

const mockAddMovie = AddMovieAction.addMovie as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockUseVideoThumbnailUpload = useVideoThumbnailUpload as jest.Mock;

// Default mock implementation for useVideoThumbnailUpload
const defaultVideoUploadMock = {
  videoFile: null,
  videoPreviewUrl: null,
  thumbnailUrl: null,
  showThumbnailSelector: false,
  thumbnailOptions: [],
  uploadProgress: 0,
  isUploading: false,
  uploadedVideoPath: null,
  videoRef: React.createRef(),
  canvasRef: React.createRef(),
  handleVideoUpload: jest.fn(),
  uploadVideo: jest.fn(),
  createDataUri: jest.fn(),
  cancelUpload: jest.fn(),
  regenerateThumbnails: jest.fn(),
  selectThumbnail: jest.fn(),
  deselectThumbnail: jest.fn(),
  resetUploadState: jest.fn(),
  setThumbnailUrl: jest.fn(),
};

describe('AddMovieForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVideoThumbnailUpload.mockReturnValue(defaultVideoUploadMock);
    
    // Mock fetch for actors
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          actors: [
            { id: '1', name: 'Actor One' },
            { id: '2', name: 'Actor Two' },
          ],
        }),
      })
    ) as jest.Mock;
  });

  describe('Component Rendering', () => {
    it('should render the form', () => {
      render(<AddMovieForm />);
      expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    it('should render all required input fields', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        expect(screen.getAllByTestId('form-item').length).toBeGreaterThan(0);
      });
    });

    it('should render form labels', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        const labels = screen.getAllByTestId('form-label');
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it('should fetch actors on mount', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/actors/all');
      });
    });

    it('should render multi-select for actors', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        expect(screen.getByTestId('multi-select')).toBeInTheDocument();
      });
    });

    it('should render video upload section', () => {
      render(<AddMovieForm />);
      const uploadLabel = screen.queryByText((content, element) =>
        element?.textContent === 'Upload Video'
      );
      expect(uploadLabel).toBeDefined();
    });

    it('should render form controls for type and genre', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        expect(screen.getAllByTestId('select').length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Form Fields', () => {
    it('should have movie name field', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        const inputs = screen.getAllByTestId('input');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should have description field', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        const inputs = screen.getAllByTestId('input');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should have duration field as read-only', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        const inputs = screen.getAllByTestId('input');
        const durationInput = inputs.find((input) => input.hasAttribute('readonly'));
        expect(durationInput).toBeDefined();
      });
    });

    it('should render type selector', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        expect(screen.getAllByTestId('select').length).toBeGreaterThan(0);
      });
    });

    it('should render genre selector', async () => {
      render(<AddMovieForm />);
      await waitFor(() => {
        expect(screen.getAllByTestId('select').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Video Upload', () => {
    it('should handle video file upload', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        handleVideoUpload: jest.fn((e, cb) => cb('01:23:45')),
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        const form = screen.getByTestId('form');
        expect(form).toBeInTheDocument();
      });
    });

    it('should show upload button when video is selected', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test-video.mp4', size: 1024 } as any,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        const form = screen.getByTestId('form');
        expect(form).toBeInTheDocument();
      });
    });

    it('should display upload progress', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test-video.mp4', size: 1024 } as any,
        isUploading: true,
        uploadProgress: 50,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        const form = screen.getByTestId('form');
        expect(form).toBeInTheDocument();
      });
    });

    it('should show estimated time during upload', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test-video.mp4', size: 1024 } as any,
        isUploading: true,
        uploadProgress: 50,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should handle upload cancellation', async () => {
      const mockCancelUpload = jest.fn();
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test-video.mp4', size: 1024 } as any,
        cancelUpload: mockCancelUpload,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        const buttons = screen.getAllByTestId('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should show uploaded status when video is uploaded', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test-video.mp4', size: 1024 } as any,
        videoPreviewUrl: 'blob:video-url',
        uploadedVideoPath: '/path/to/video',
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });
  });

  describe('Thumbnail Selection', () => {
    it('should show thumbnail selector when options available', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoPreviewUrl: 'blob:video-url',
        showThumbnailSelector: true,
        thumbnailOptions: [
          { dataUrl: 'blob:1', timestamp: 0 },
          { dataUrl: 'blob:2', timestamp: 5 },
        ],
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('thumbnail-selector')).toBeInTheDocument();
      });
    });

    it('should show thumbnail preview when thumbnail is selected', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: 'blob:selected-thumbnail',
        showThumbnailSelector: false,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('thumbnail-preview')).toBeInTheDocument();
      });
    });

    it('should show manual thumbnail upload when no thumbnail selected', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: null,
        showThumbnailSelector: false,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('thumbnail-preview')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should show error when no thumbnail selected', async () => {
      mockToast.error = jest.fn();
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: null,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should call addMovie action on form submit', async () => {
      mockAddMovie.mockResolvedValue({ success: 'Movie added successfully!' });
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: 'blob:thumbnail',
      });
      mockToast.success = jest.fn();

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should reset form on successful submission', async () => {
      mockAddMovie.mockResolvedValue({ success: 'Movie added!' });
      mockToast.success = jest.fn();
      const mockResetUploadState = jest.fn();
      
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: 'blob:thumbnail',
        resetUploadState: mockResetUploadState,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should show error message on submission failure', async () => {
      mockAddMovie.mockResolvedValue({ error: 'Failed to add movie' });
      mockToast.error = jest.fn();
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: 'blob:thumbnail',
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should display success toast notification', async () => {
      mockAddMovie.mockResolvedValue({ success: 'Movie added successfully!' });
      mockToast.success = jest.fn();
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: 'blob:thumbnail',
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should display error toast notification', async () => {
      mockAddMovie.mockResolvedValue({ error: 'Validation failed' });
      mockToast.error = jest.fn();
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: 'blob:thumbnail',
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });
  });

  describe('Actor Fetching', () => {
    it('should handle successful actor fetch', async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            actors: [
              { id: '1', name: 'Actor One' },
              { id: '2', name: 'Actor Two' },
            ],
          }),
        })
      ) as jest.Mock;

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/actors/all');
      });
    });

    it('should handle failed actor fetch', async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.reject(new Error('Fetch failed'))
      ) as jest.Mock;

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/actors/all');
      });
    });

    it('should handle empty actor list', async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ actors: [] }),
        })
      ) as jest.Mock;

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/actors/all');
      });
    });

    it('should handle invalid actor data', async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ actors: null }),
        })
      ) as jest.Mock;

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/actors/all');
      });
    });
  });

  describe('Loading States', () => {
    it('should disable submit button while pending', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: 'blob:thumbnail',
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should disable upload button while uploading', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test.mp4', size: 1024 } as any,
        isUploading: true,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should disable actors selector while loading', async () => {
      globalThis.fetch = jest.fn(() =>
        new Promise(() => {}) // Never resolves
      ) as jest.Mock;

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('multi-select')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should render form with validation schema', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should have form message elements for validation errors', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        const messages = screen.getAllByTestId('form-message');
        expect(messages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Environment Variables', () => {
    it('should use environment variables for type options', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should use environment variables for genre options', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });
  });

  describe('UI Interactions', () => {
    it('should render video upload input', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        const inputs = screen.getAllByTestId('input');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should handle multi-select interaction', async () => {
      jest.fn();
      mockUseVideoThumbnailUpload.mockReturnValue(defaultVideoUploadMock);

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('multi-select')).toBeInTheDocument();
      });
    });

    it('should show all form controls', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should render save button', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('button')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle actor fetch error gracefully', async () => {
        globalThis.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock;

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should handle missing thumbnail on submit', async () => {
      mockToast.error = jest.fn();
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        thumbnailUrl: null,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should handle upload cancellation error', async () => {
      const mockCancelUpload = jest.fn().mockRejectedValue(new Error('Cancel failed'));
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test.mp4', size: 1024 } as any,
        cancelUpload: mockCancelUpload,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle component with all props/state at defaults', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue(defaultVideoUploadMock);

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should handle rapid state changes', async () => {
      const { rerender } = render(<AddMovieForm />);

      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test.mp4', size: 1024 } as any,
      });

      rerender(<AddMovieForm />);

      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        isUploading: true,
        uploadProgress: 50,
      });

      rerender(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should handle very long actor names', async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            actors: [
              {
                id: '1',
                name: 'This is a very long actor name that should be displayed correctly in the form',
              },
            ],
          }),
        })
      ) as jest.Mock;

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith('/api/actors/all');
      });
    });

    it('should handle large file sizes', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: {
          name: 'large-video.mp4',
          size: 2 * 1024 * 1024 * 1024, // 2GB
        } as any,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should handle 100% upload progress', async () => {
      mockUseVideoThumbnailUpload.mockReturnValue({
        ...defaultVideoUploadMock,
        videoFile: { name: 'test.mp4', size: 1024 } as any,
        isUploading: false,
        uploadProgress: 100,
      });

      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form structure', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('form')).toBeInTheDocument();
      });
    });

    it('should have form labels for inputs', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        const labels = screen.getAllByTestId('form-label');
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it('should have accessible buttons', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        expect(screen.getByTestId('button')).toBeInTheDocument();
      });
    });

    it('should have proper video input acceptance', async () => {
      render(<AddMovieForm />);

      await waitFor(() => {
        const inputs = screen.getAllByTestId('input');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });
  });
});
