import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VideoUploadField } from '../VideoUploadField';

describe('VideoUploadField', () => {
  const mockFile = new File(['video content'], 'test-video.mp4', {
    type: 'video/mp4',
  });

  const defaultProps = {
    videoFile: null,
    generatedVideoId: '',
    uploadProgress: 0,
    isUploading: false,
    uploadedVideoPath: '',
    isPending: false,
    currentVideoUrl: '',
    isOptional: false,
    onVideoChange: jest.fn(),
    onUpload: jest.fn(),
    onCancel: jest.fn(),
    estimatedTime: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the upload label', () => {
      render(<VideoUploadField {...defaultProps} />);
      expect(screen.getByText('Upload Video')).toBeInTheDocument();
    });

    it('should display "(optional)" label when isOptional is true', () => {
      render(<VideoUploadField {...defaultProps} isOptional={true} />);
      expect(screen.getByText(/Upload Video \(optional\)/)).toBeInTheDocument();
    });

    it('should render hidden file input', () => {
      const { container } = render(<VideoUploadField {...defaultProps} />);
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('should accept only video files', () => {
      render(<VideoUploadField {...defaultProps} />);
      const fileInput = document.getElementById(
        'video-upload'
      ) as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'video/*');
    });
  });

  describe('Initial State', () => {
    it('should display upload icon when no video is selected', () => {
      render(<VideoUploadField {...defaultProps} />);
      expect(screen.getByText(/Click to select a video/i)).toBeInTheDocument();
      expect(screen.getByText(/MP4 file, max. 2GB/i)).toBeInTheDocument();
    });

    it('should show current video URL when provided', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          currentVideoUrl="https://example.com/video.mp4"
        />
      );
      expect(screen.getByText(/Current: https:\/\/example\.com\/video\.mp4/)).toBeInTheDocument();
    });

    it('should not show current video URL when none provided', () => {
      render(<VideoUploadField {...defaultProps} />);
      expect(screen.getByText(/MP4 file, max. 2GB/i)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should display selected video file info', () => {
      render(
        <VideoUploadField {...defaultProps} videoFile={mockFile} />
      );
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    });

    it('should display file size in MB', () => {
      render(
        <VideoUploadField {...defaultProps} videoFile={mockFile} />
      );
      const fileSizeText = screen.getByText(/MB/);
      expect(fileSizeText).toBeInTheDocument();
    });

    it('should truncate long filenames', () => {
      const longNameFile = new File(['video'], 'this-is-a-very-long-video-filename-that-should-be-truncated.mp4', {
        type: 'video/mp4',
      });
      render(
        <VideoUploadField {...defaultProps} videoFile={longNameFile} />
      );
      const fileName = screen.getByText(/\.\.\./);
      expect(fileName).toBeInTheDocument();
      expect(fileName.textContent?.length).toBeLessThanOrEqual(40);
    });

    it('should display generated video ID when provided', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          generatedVideoId="test-id-12345"
        />
      );
      expect(screen.getByText(/ID: test-id-12345/)).toBeInTheDocument();
    });

    it('should show check icon when video is selected', () => {
      const { container } = render(
        <VideoUploadField {...defaultProps} videoFile={mockFile} />
      );
      const checkIcon = container.querySelector('svg[class*="text-green-500"]');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should change border color when video is selected', () => {
      const { container } = render(
        <VideoUploadField {...defaultProps} videoFile={mockFile} />
      );
      const uploadLabel = container.querySelector('label[for="video-upload"]');
      expect(uploadLabel).toHaveClass('border-green-500');
      expect(uploadLabel).toHaveClass('bg-green-900/20');
    });
  });

  describe('File Input Change', () => {
    it('should call onVideoChange when file is selected', async () => {
      const onVideoChangeMock = jest.fn();
      const { container } = render(
        <VideoUploadField
          {...defaultProps}
          onVideoChange={onVideoChangeMock}
        />
      );

      const fileInput = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(onVideoChangeMock).toHaveBeenCalled();
    });

    it('should not allow file selection when pending', () => {
      const { container } = render(
        <VideoUploadField {...defaultProps} isPending={true} />
      );
      const fileInput = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });

    it('should not allow file selection when uploading', () => {
      const { container } = render(
        <VideoUploadField {...defaultProps} isUploading={true} />
      );
      const fileInput = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });
  });

  describe('Upload Button', () => {
    it('should not show upload button when no file is selected', () => {
      render(<VideoUploadField {...defaultProps} />);
      expect(
        screen.queryByRole('button', { name: /Upload Video/i })
      ).not.toBeInTheDocument();
    });

    it('should show upload button when file is selected', () => {
      render(
        <VideoUploadField {...defaultProps} videoFile={mockFile} />
      );
      expect(
        screen.getByRole('button', { name: /Upload Video/i })
      ).toBeInTheDocument();
    });

    it('should call onUpload when upload button is clicked', () => {
      const onUploadMock = jest.fn();
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          onUpload={onUploadMock}
        />
      );

      const uploadButton = screen.getByRole('button', {
        name: /Upload Video/i,
      });
      fireEvent.click(uploadButton);

      expect(onUploadMock).toHaveBeenCalled();
    });

    it('should disable upload button when uploading', () => {
      const uploadButton = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
        />
      ).getByRole('button', { name: /Uploading/i });

      expect(uploadButton).toBeDisabled();
    });

    it('should disable upload button when already uploaded', () => {
      const uploadButton = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          uploadedVideoPath="/path/to/video.mp4"
        />
      ).getByRole('button', { name: /Uploaded/i });

      expect(uploadButton).toBeDisabled();
    });

    it('should disable upload button when pending', () => {
      const uploadButton = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isPending={true}
        />
      ).getByRole('button', { name: /Upload Video/i });

      expect(uploadButton).toBeDisabled();
    });

    it('should show uploading state with progress', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
          uploadProgress={45}
        />
      );

      expect(screen.getByText(/Uploading\.\.\. 45%/)).toBeInTheDocument();
    });

    it('should show uploaded state after completion', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          uploadedVideoPath="/path/to/video.mp4"
        />
      );

      expect(screen.getByText(/Uploaded/)).toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('should show cancel button when file is selected', () => {
      render(
        <VideoUploadField {...defaultProps} videoFile={mockFile} />
      );

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(
        (btn) =>
          btn.className.includes('bg-zinc-700') ||
          btn.className.includes('hover:bg-zinc-600')
      );
      expect(cancelButton).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const onCancelMock = jest.fn();
      const { getAllByRole } = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          onCancel={onCancelMock}
        />
      );

      const buttons = getAllByRole('button');
      const cancelButton = buttons[buttons.length - 1];
      fireEvent.click(cancelButton);

      expect(onCancelMock).toHaveBeenCalled();
    });

    it('should not allow cancel when pending', () => {
      const { getAllByRole } = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isPending={true}
        />
      );

      const buttons = getAllByRole('button');
      const cancelButton = buttons[buttons.length - 1];
      expect(cancelButton).toBeDisabled();
    });

    it('should not allow cancel when uploading', () => {
      const { getAllByRole } = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
        />
      );

      const buttons = getAllByRole('button');
      const cancelButton = buttons[buttons.length - 1];
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Progress Bar', () => {
    it('should not show progress bar initially', () => {
      render(<VideoUploadField {...defaultProps} />);
      const progressBar = document.querySelector(
        '[class*="bg-zinc-700"][class*="rounded-full"]'
      );
      expect(progressBar).not.toBeInTheDocument();
    });

    it('should show progress bar when uploading', () => {
      const { container } = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
          uploadProgress={50}
        />
      );

      const progressBar = container.querySelector(
        '[class*="bg-red-600"][class*="h-2"]'
      );
      expect(progressBar).toBeInTheDocument();
    });

    it('should update progress bar width based on uploadProgress', () => {
      const { container } = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
          uploadProgress={75}
        />
      );

      const progressBar = container.querySelector(
        '[class*="bg-red-600"][class*="h-2"]'
      ) as HTMLElement;
      expect(progressBar).toHaveStyle({ width: '75%' });
    });

    it('should display progress percentage', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
          uploadProgress={60}
        />
      );

      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('should display estimated time when provided', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
          uploadProgress={30}
          estimatedTime="2m 30s"
        />
      );

      expect(screen.getByText(/~2m 30s left/)).toBeInTheDocument();
    });

    it('should not display estimated time when not provided', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
          uploadProgress={30}
        />
      );

      const progressSection = screen.getByText('30%').parentElement;
      expect(progressSection?.textContent).not.toContain('left');
    });
  });

  describe('Disabled States', () => {
    it('should disable upload area when pending', () => {
      const { container } = render(
        <VideoUploadField {...defaultProps} isPending={true} />
      );

      const uploadArea = container.querySelector('label[for="video-upload"]');
      expect(uploadArea).toHaveClass('opacity-50');
      expect(uploadArea).toHaveClass('cursor-not-allowed');
    });

    it('should disable upload area when uploading', () => {
      const { container } = render(
        <VideoUploadField {...defaultProps} isUploading={true} />
      );

      const uploadArea = container.querySelector('label[for="video-upload"]');
      expect(uploadArea).toHaveClass('opacity-50');
      expect(uploadArea).toHaveClass('cursor-not-allowed');
    });

    it('should enable upload area when not pending or uploading', () => {
      const { container } = render(
        <VideoUploadField
          {...defaultProps}
          isPending={false}
          isUploading={false}
        />
      );

      const uploadArea = container.querySelector('label');
      expect(uploadArea).not.toHaveClass('opacity-50');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete upload flow', () => {
      const onVideoChangeMock = jest.fn();
      const onUploadMock = jest.fn();
      const onCancelMock = jest.fn();

      const { rerender } = render(
        <VideoUploadField
          {...defaultProps}
          onVideoChange={onVideoChangeMock}
          onUpload={onUploadMock}
          onCancel={onCancelMock}
        />
      );

      // Step 1: Select file
      const { container: container1 } = render(
        <VideoUploadField
          {...defaultProps}
          onVideoChange={onVideoChangeMock}
          onUpload={onUploadMock}
          onCancel={onCancelMock}
        />
      );
      const fileInput = container1.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(onVideoChangeMock).toHaveBeenCalled();

      // Step 2: Upload file
      rerender(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          onVideoChange={onVideoChangeMock}
          onUpload={onUploadMock}
          onCancel={onCancelMock}
        />
      );

      const uploadButton = screen.getByRole('button', {
        name: /Upload Video/i,
      });
      fireEvent.click(uploadButton);

      expect(onUploadMock).toHaveBeenCalled();

      // Step 3: Uploading state
      rerender(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          isUploading={true}
          uploadProgress={50}
          onVideoChange={onVideoChangeMock}
          onUpload={onUploadMock}
          onCancel={onCancelMock}
        />
      );

      expect(screen.getByText(/Uploading\.\.\. 50%/)).toBeInTheDocument();

      // Step 4: Upload complete
      rerender(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          uploadedVideoPath="/path/to/video.mp4"
          onVideoChange={onVideoChangeMock}
          onUpload={onUploadMock}
          onCancel={onCancelMock}
        />
      );

      expect(screen.getByText(/Uploaded/)).toBeInTheDocument();
    });

    it('should handle cancel during selection', () => {
      const onCancelMock = jest.fn();

      const { getAllByRole } = render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          onCancel={onCancelMock}
        />
      );

      const buttons = getAllByRole('button');
      const cancelButton = buttons[buttons.length - 1];
      fireEvent.click(cancelButton);

      expect(onCancelMock).toHaveBeenCalled();
    });

    it('should preserve current video URL while uploading new one', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
          currentVideoUrl="https://example.com/current-video.mp4"
          isUploading={true}
          uploadProgress={50}
        />
      );

      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText(/Uploading\.\.\. 50%/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      const { container } = render(
        <VideoUploadField {...defaultProps} />
      );
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('id', 'video-upload');
    });

    it('should have clickable label associated with file input', () => {
      const { container } = render(
        <VideoUploadField {...defaultProps} />
      );
      const label = container.querySelector('label[for="video-upload"]');
      expect(label).toBeInTheDocument();
    });

    it('should show file name with title attribute for full name', () => {
      render(
        <VideoUploadField
          {...defaultProps}
          videoFile={mockFile}
        />
      );
      const fileName = screen.getByTitle('test-video.mp4');
      expect(fileName).toBeInTheDocument();
    });
  });
});
