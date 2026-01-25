import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { ThumbnailSelector } from '../ThumbnailSelector';

// Wrapper component to provide FormProvider for tests
const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const form = useForm();
  return <FormProvider {...form}>{children}</FormProvider>;
};

describe('ThumbnailSelector', () => {
  const mockThumbnails = [
    'data:image/jpeg;base64,thumb1',
    'data:image/jpeg;base64,thumb2',
    'data:image/jpeg;base64,thumb3',
  ];

  it('should render null when no thumbnails provided', () => {
    const { container } = render(
      <FormWrapper>
        <ThumbnailSelector
          thumbnailOptions={[]}
          onSelectThumbnail={jest.fn()}
          onRegenerate={jest.fn()}
        />
      </FormWrapper>
    );

    // When thumbnails are empty, the component returns null - no selector div
    expect(container.querySelector('[class*="grid"]')).not.toBeInTheDocument();
  });

  it('should render thumbnail grid when thumbnails are provided', () => {
    render(
      <FormWrapper>
        <ThumbnailSelector
          thumbnailOptions={mockThumbnails}
          onSelectThumbnail={jest.fn()}
          onRegenerate={jest.fn()}
        />
      </FormWrapper>
    );

    // Check for 3 thumbnail buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(4); // 3 thumbnails + 1 regenerate button
  });

  it('should call onSelectThumbnail when thumbnail is clicked', () => {
    const onSelectMock = jest.fn();
    render(
      <FormWrapper>
        <ThumbnailSelector
          thumbnailOptions={mockThumbnails}
          onSelectThumbnail={onSelectMock}
          onRegenerate={jest.fn()}
        />
      </FormWrapper>
    );

    const images = screen.getAllByAltText(/Thumbnail/);
    fireEvent.click(images[0].closest('button')!);

    expect(onSelectMock).toHaveBeenCalledWith(mockThumbnails[0]);
  });

  it('should call onRegenerate when regenerate button is clicked', () => {
    const onRegenerateMock = jest.fn();
    render(
      <FormWrapper>
        <ThumbnailSelector
          thumbnailOptions={mockThumbnails}
          onSelectThumbnail={jest.fn()}
          onRegenerate={onRegenerateMock}
        />
      </FormWrapper>
    );

    // Find regenerate button by text or role
    const regenerateButton = screen.getByText(/Generate new|Regenerate/);
    fireEvent.click(regenerateButton);

    expect(onRegenerateMock).toHaveBeenCalled();
  });

  it('should support keyboard selection with Enter key', () => {
    const onSelectMock = jest.fn();
    render(
      <FormWrapper>
        <ThumbnailSelector
          thumbnailOptions={mockThumbnails}
          onSelectThumbnail={onSelectMock}
          onRegenerate={jest.fn()}
        />
      </FormWrapper>
    );

    const images = screen.getAllByAltText(/Thumbnail/);
    const button = images[0].closest('button')!;

    fireEvent.keyDown(button, { key: 'Enter' });

    expect(onSelectMock).toHaveBeenCalledWith(mockThumbnails[0]);
  });

  it('should support keyboard selection with Space key', () => {
    const onSelectMock = jest.fn();
    render(
      <FormWrapper>
        <ThumbnailSelector
          thumbnailOptions={mockThumbnails}
          onSelectThumbnail={onSelectMock}
          onRegenerate={jest.fn()}
        />
      </FormWrapper>
    );

    const images = screen.getAllByAltText(/Thumbnail/);
    const button = images[0].closest('button')!;

    fireEvent.keyDown(button, { key: ' ' });

    expect(onSelectMock).toHaveBeenCalledWith(mockThumbnails[0]);
  });

  it('should render proper accessibility labels', () => {
    render(
      <FormWrapper>
        <ThumbnailSelector
          thumbnailOptions={mockThumbnails}
          onSelectThumbnail={jest.fn()}
          onRegenerate={jest.fn()}
        />
      </FormWrapper>
    );

    mockThumbnails.forEach((_, index) => {
      const label = screen.getByLabelText(`Select thumbnail ${index + 1}`);
      expect(label).toBeInTheDocument();
    });
  });
});
