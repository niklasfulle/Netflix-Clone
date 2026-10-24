import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { ThumbnailPreview } from '../ThumbnailPreview';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Wrapper component to provide FormProvider for tests
const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const form = useForm();
  return <FormProvider {...form}>{children}</FormProvider>;
};

describe('ThumbnailPreview', () => {
  const mockThumbnailUrl = 'data:image/jpeg;base64,test';

  it('adjusts a selected video frame by five seconds and locks controls while capturing', () => {
    const adjust = jest.fn();
    const props = { thumbnailUrl: mockThumbnailUrl, selectedTimestamp: 65, videoDuration: 120, onAdjustThumbnail: adjust };
    const { rerender } = render(<LanguageProvider initialLocale="de"><FormWrapper><ThumbnailPreview {...props} /></FormWrapper></LanguageProvider>);
    expect(screen.getByRole('status')).toHaveTextContent('01:05');
    fireEvent.click(screen.getByRole('button', { name: '5 Sekunden zurück' }));
    fireEvent.click(screen.getByRole('button', { name: '5 Sekunden vor' }));
    expect(adjust.mock.calls).toEqual([[-5], [5]]);
    rerender(<LanguageProvider initialLocale="de"><FormWrapper><ThumbnailPreview {...props} isAdjusting /></FormWrapper></LanguageProvider>);
    expect(screen.getByRole('status')).toHaveTextContent('Vorschaubild wird aktualisiert...');
    expect(screen.getByRole('button', { name: '5 Sekunden zurück' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '5 Sekunden vor' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '5 Sekunden vor' }));
    expect(adjust).toHaveBeenCalledTimes(2);
  });

  it('disables movement beyond video boundaries and keeps manually uploaded images without seek controls', () => {
    const props = { thumbnailUrl: mockThumbnailUrl, videoDuration: 60, onAdjustThumbnail: jest.fn() };
    const { rerender } = render(<FormWrapper><ThumbnailPreview {...props} selectedTimestamp={0} /></FormWrapper>);
    expect(screen.getByRole('button', { name: '5 seconds earlier' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '5 seconds later' })).toBeEnabled();
    rerender(<FormWrapper><ThumbnailPreview {...props} selectedTimestamp={59.95} adjustmentError /></FormWrapper>);
    expect(screen.getByRole('button', { name: '5 seconds later' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Your previous image is still selected');
    rerender(<FormWrapper><ThumbnailPreview {...props} /></FormWrapper>);
    expect(screen.queryByRole('button', { name: '5 seconds earlier' })).not.toBeInTheDocument();
  });

  it('should render nothing when no thumbnail URL is provided', () => {
    const { container } = render(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl=""
          onManualUpload={jest.fn()}
        />
      </FormWrapper>
    );

    // Should only render the manual upload section
    const uploadSection = screen.getByText(/Or upload.*manually/i);
    expect(uploadSection).toBeInTheDocument();
  });

  it('should display thumbnail when URL is provided', () => {
    render(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl={mockThumbnailUrl}
          useImage={true}
        />
      </FormWrapper>
    );

    const img = screen.getByAltText('Selected Thumbnail');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockThumbnailUrl);
  });

  it('should show deselect button when showDeselect is true', () => {
    render(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl={mockThumbnailUrl}
          showDeselect={true}
          onDeselect={jest.fn()}
          useImage={true}
        />
      </FormWrapper>
    );

    const deselectButton = screen.getByText(/Deselect/);
    expect(deselectButton).toBeInTheDocument();
  });


  it('should hide deselect button when showDeselect is false', () => {
    render(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl={mockThumbnailUrl}
          showDeselect={false}
          useImage={true}
        />
      </FormWrapper>
    );

    const deselectButton = screen.queryByText(/Deselect/);
    expect(deselectButton).not.toBeInTheDocument();
  });

  it('should render manual upload section when onManualUpload is provided', () => {
    render(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl={mockThumbnailUrl}
          onManualUpload={jest.fn()}
          useImage={true}
        />
      </FormWrapper>
    );

    const uploadLabel = screen.getByText(/Or upload.*manually/i);
    expect(uploadLabel).toBeInTheDocument();
  });

  it('should use correct title based on useImage prop', () => {
    const { rerender } = render(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl={mockThumbnailUrl}
          useImage={true}
        />
      </FormWrapper>
    );

    expect(screen.getByText('Selected Thumbnail')).toBeInTheDocument();

    rerender(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl={mockThumbnailUrl}
          useImage={false}
        />
      </FormWrapper>
    );

    expect(screen.getByText('Current Thumbnail')).toBeInTheDocument();
  });

  it('should handle file upload input change', () => {
    const onUploadMock = jest.fn();
    render(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl=""
          onManualUpload={onUploadMock}
        />
      </FormWrapper>
    );

    const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
    // Note: Testing file input directly requires simulating file selection
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('should render proper accessibility attributes', () => {
    const onUploadMock = jest.fn();
    render(
      <FormWrapper>
        <ThumbnailPreview
          thumbnailUrl={mockThumbnailUrl}
          onManualUpload={onUploadMock}
          useImage={true}
        />
      </FormWrapper>
    );

    const img = screen.getByAltText('Selected Thumbnail');
    expect(img).toBeInTheDocument();
  });
});
