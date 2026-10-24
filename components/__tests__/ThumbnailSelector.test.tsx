import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { ThumbnailSelector } from '../ThumbnailSelector';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

// Wrapper component to provide FormProvider for tests
const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const form = useForm();
  return <FormProvider {...form}>{children}</FormProvider>;
};

describe('ThumbnailSelector', () => {
  it('shows progress immediately, reveals captured frames, and enables selection only when ready', () => {
    const select = jest.fn();
    const regenerate = jest.fn();
    const { rerender } = render(
      <FormWrapper><ThumbnailSelector thumbnailOptions={[]} isGenerating onSelectThumbnail={select} onRegenerate={regenerate} /></FormWrapper>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Generating previews: 0 of 6 ready');
    expect(screen.getByRole('progressbar', { name: 'Preview generation' })).toHaveAttribute('value', '0');
    expect(screen.getByRole('button', { name: 'Generating previews...' })).toBeDisabled();

    rerender(<FormWrapper><ThumbnailSelector thumbnailOptions={['/new.jpg']} thumbnailTimestamps={[125]} isGenerating onSelectThumbnail={select} onRegenerate={regenerate} /></FormWrapper>);
    expect(screen.getByRole('status')).toHaveTextContent('1 of 6 ready');
    expect(screen.getByText('02:05')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select thumbnail 1' }));
    expect(select).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Select thumbnail 1' })).toBeDisabled();

    rerender(<FormWrapper><ThumbnailSelector thumbnailOptions={['/new.jpg']} thumbnailTimestamps={[125]} onSelectThumbnail={select} onRegenerate={regenerate} /></FormWrapper>);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('New previews are ready.');
    fireEvent.click(screen.getByRole('button', { name: 'Select thumbnail 1' }));
    expect(select).toHaveBeenCalledWith('/new.jpg');
    expect(screen.getByRole('button', { name: 'Generate new' })).toBeEnabled();
  });

  it('offers a retry after failure even when no frame could be generated', () => {
    const regenerate = jest.fn();
    render(<LanguageProvider initialLocale="de"><FormWrapper><ThumbnailSelector thumbnailOptions={[]} generationError onSelectThumbnail={jest.fn()} onRegenerate={regenerate} /></FormWrapper></LanguageProvider>);
    expect(screen.getByRole('alert')).toHaveTextContent('Vorschaubilder konnten nicht erstellt werden');
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(regenerate).toHaveBeenCalledTimes(1);
  });

  it('supports Space selection and ignores unrelated navigation keys', () => {
    const select = jest.fn();
    render(<FormWrapper><ThumbnailSelector thumbnailOptions={['/thumbnail.jpg']} onSelectThumbnail={select} onRegenerate={jest.fn()} /></FormWrapper>);
    const button = screen.getByRole('button', { name: 'Select thumbnail 1' });
    fireEvent.keyDown(button, { key: 'Tab' });
    expect(select).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: ' ' });
    expect(select).toHaveBeenCalledWith('/thumbnail.jpg');
  });
  it('localizes image selection and its accessible labels in German', () => {
    render(
      <LanguageProvider initialLocale="de">
        <FormWrapper>
          <ThumbnailSelector thumbnailOptions={['/thumbnail.jpg']} onSelectThumbnail={jest.fn()} onRegenerate={jest.fn()} />
        </FormWrapper>
      </LanguageProvider>,
    );
    expect(screen.getByText('Vorschaubild auswählen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neu generieren' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vorschaubild 1 auswählen' })).toBeInTheDocument();
    expect(screen.getByAltText('Vorschaubild 1')).toBeInTheDocument();
  });
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
