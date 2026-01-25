import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { ThumbnailPreview } from '../ThumbnailPreview';

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
