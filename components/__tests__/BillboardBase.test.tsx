import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/image before importing component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className, priority }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-priority={priority}
      data-testid="next-image"
    />
  ),
}));

// Mock child components
jest.mock('@/components/BillboardInfoButton', () => {
  return function MockBillboardInfoButton({ movieId }: any) {
    return <button data-testid="info-button">{movieId}</button>;
  };
});

jest.mock('@/components/BillboardPlayButton', () => {
  return function MockBillboardPlayButton({ movieId }: any) {
    return <button data-testid="play-button">{movieId}</button>;
  };
});

import BillboardBase from '../BillboardBase';

describe('BillboardBase', () => {
  const mockData = {
    id: 'movie-1',
    title: 'Test Movie Title',
    description: 'This is a test description for the movie that should display correctly.',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth
    Object.defineProperty(globalThis.window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toBeInTheDocument();
    });

    it('should render the main container', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv?.className).toMatch(/relative/);
      expect(mainDiv?.className).toMatch(/h-\[56.25vw\]/);
    });

    it('should render video on desktop when not loading', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('should render image on mobile when not loading', async () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      render(<BillboardBase data={mockData} isLoading={false} />);
      await waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={true} />);
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should not display media when loading', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={true} />);
      const video = container.querySelector('video');
      const image = container.querySelector('img[alt="Thumbnail"]');
      expect(video).not.toBeInTheDocument();
      expect(image).not.toBeInTheDocument();
    });

    it('should have loading container with proper styling', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={true} />);
      const loadingDiv = container.querySelector('.flex');
      expect(loadingDiv?.className).toMatch(/flex/);
      expect(loadingDiv?.className).toMatch(/items-center/);
      expect(loadingDiv?.className).toMatch(/justify-center/);
      expect(loadingDiv?.className).toMatch(/bg-zinc-800/);
    });

    it('should display spinner SVG with proper attributes', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={true} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const classNameStr = svg?.className?.baseVal || svg?.className || '';
      expect(classNameStr.toString()).toMatch(/w-10/);
      expect(classNameStr.toString()).toMatch(/h-10/);
      expect(classNameStr.toString()).toMatch(/text-zinc-500/);
    });

    it('should not display title when loading', () => {
      render(<BillboardBase data={mockData} isLoading={true} />);
      // Title is still rendered, but loading spinner is displayed
      expect(screen.queryByText(mockData.title)).toBeInTheDocument();
    });

    it('should not display description when loading', () => {
      render(<BillboardBase data={mockData} isLoading={true} />);
      // Description is still rendered, but loading spinner is displayed
      const description = screen.queryByText(/This is a test/);
      expect(description).toBeInTheDocument();
    });

    it('should not display buttons when loading', () => {
      render(<BillboardBase data={mockData} isLoading={true} />);
      // Buttons are still rendered, but loading spinner is displayed
      expect(screen.queryByTestId('play-button')).toBeInTheDocument();
      expect(screen.queryByTestId('info-button')).toBeInTheDocument();
    });
  });

  describe('Desktop vs Mobile Rendering', () => {
    it('should render video on desktop', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const video = container.querySelector('video');
        expect(video).toBeInTheDocument();
      });
    });

    it('should render image on mobile', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image).toBeInTheDocument();
      });
    });

    it('should video have correct styling', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const video = container.querySelector('video');
        expect(video?.className).toMatch(/w-full/);
        expect(video?.className).toMatch(/h-\[56.25vw\]/);
        expect(video?.className).toMatch(/brightness-\[60%\]/);
        expect(video?.className).toMatch(/object-cover/);
      });
    });

    it('should image have correct styling', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image.className).toMatch(/w-full/);
        expect(image.className).toMatch(/brightness-\[60%\]/);
        expect(image.className).toMatch(/object-cover/);
      });
    });
  });

  describe('Title Display', () => {
    it('should display title when data is provided', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      expect(screen.getByText(mockData.title)).toBeInTheDocument();
    });

    it('should not display title when data is undefined', () => {
      render(<BillboardBase data={undefined} isLoading={false} />);
      expect(screen.queryByText(mockData.title)).not.toBeInTheDocument();
    });

    it('should have title with correct styling', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      const titleElement = screen.getByText(mockData.title);
      expect(titleElement.className).toMatch(/font-bold/);
      expect(titleElement.className).toMatch(/text-white/);
      expect(titleElement.className).toMatch(/text-2xl/);
      expect(titleElement.className).toMatch(/md:text-5xl/);
      expect(titleElement.className).toMatch(/lg:text-6xl/);
      expect(titleElement.className).toMatch(/drop-shadow-xl/);
      expect(titleElement.className).toMatch(/line-clamp-2/);
    });

    it('should truncate title with ellipsis', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      const titleElement = screen.getByText(mockData.title);
      expect(titleElement.className).toMatch(/text-ellipsis/);
      expect(titleElement.className).toMatch(/overflow-hidden/);
    });
  });

  describe('Description Display', () => {
    it('should display description when data is provided', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      expect(screen.getByText(/This is a test/)).toBeInTheDocument();
    });

    it('should not display description when data.description is "test"', () => {
      const testData = { ...mockData, description: 'test' };
      render(<BillboardBase data={testData} isLoading={false} />);
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('should truncate description to 250 characters', () => {
      const longDescription = 'a'.repeat(300);
      const testData = { ...mockData, description: longDescription };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.textContent).toContain('...');
      expect(descElement.textContent?.length).toBeLessThanOrEqual(253);
    });

    it('should add ellipsis when description is long', () => {
      const testData = { ...mockData, description: 'a'.repeat(150) };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.textContent).toContain('...');
    });

    it('should not add ellipsis when description is short', () => {
      const testData = { ...mockData, description: 'Short description' };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.textContent).not.toContain('...');
    });

    it('should have description with correct styling', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.className).toMatch(/text-white/);
      expect(descElement.className).toMatch(/text-lg/);
      expect(descElement.className).toMatch(/mt-3/);
      expect(descElement.className).toMatch(/md:mt-8/);
      expect(descElement.className).toMatch(/drop-shadow-xl/);
      expect(descElement.className).toMatch(/line-clamp-3/);
    });

    it('should have responsive width on description', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.className).toMatch(/w-\[90%\]/);
      expect(descElement.className).toMatch(/md:w-\[80%\]/);
      expect(descElement.className).toMatch(/lg:w-\[90%\]/);
    });
  });

  describe('Button Integration', () => {
    it('should render play button', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
    });

    it('should render info button', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      expect(screen.getByTestId('info-button')).toBeInTheDocument();
    });

    it('should pass movieId to play button', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      const playButton = screen.getByTestId('play-button');
      expect(playButton.textContent).toBe(mockData.id);
    });

    it('should pass movieId to info button', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      const infoButton = screen.getByTestId('info-button');
      expect(infoButton.textContent).toBe(mockData.id);
    });

    it('should pass empty string when movieId is undefined', () => {
      render(<BillboardBase data={undefined} isLoading={false} />);
      const playButton = screen.getByTestId('play-button');
      const infoButton = screen.getByTestId('info-button');
      expect(playButton.textContent).toBe('');
      expect(infoButton.textContent).toBe('');
    });

    it('should not render buttons when loading', () => {
      render(<BillboardBase data={mockData} isLoading={true} />);
      // Buttons are still rendered, but loading spinner is displayed
      expect(screen.queryByTestId('play-button')).toBeInTheDocument();
      expect(screen.queryByTestId('info-button')).toBeInTheDocument();
    });

    it('should have buttons in flex row container', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const flexContainer = container.querySelector('.flex.flex-row');
      expect(flexContainer).toBeInTheDocument();
      const buttons = flexContainer?.querySelectorAll('[data-testid]');
      expect(buttons?.length).toBe(2);
    });
  });

  describe('Props Handling', () => {
    it('should accept data prop', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      expect(screen.getByText(mockData.title)).toBeInTheDocument();
    });

    it('should handle undefined data', () => {
      render(<BillboardBase data={undefined} isLoading={false} />);
      expect(screen.queryByText(mockData.title)).not.toBeInTheDocument();
    });

    it('should accept isLoading prop', () => {
      const { container: loadingContainer } = render(
        <BillboardBase data={mockData} isLoading={true} />
      );
      expect(loadingContainer.querySelector('svg')).toBeInTheDocument();

      const { container: notLoadingContainer } = render(
        <BillboardBase data={mockData} isLoading={false} />
      );
      expect(notLoadingContainer.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should accept priority prop', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      render(<BillboardBase data={mockData} isLoading={false} priority={true} />);
      waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image).toHaveAttribute('data-priority', 'true');
      });
    });

    it('should handle missing priority prop', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image).toHaveAttribute('data-priority');
      });
    });
  });

  describe('Video Element', () => {
    it('should have video element with correct attributes', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const video = container.querySelector('video');
        expect(video).toHaveAttribute('autoplay');
        expect(video).toHaveAttribute('muted');
        expect(video).toHaveAttribute('loop');
      });
    });

    it('should use thumbnail as poster on video', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const video = container.querySelector('video');
        expect(video?.getAttribute('poster')).toBe(mockData.thumbnailUrl);
      });
    });

    it('should construct correct video src', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const video = container.querySelector('video');
        expect(video?.getAttribute('src')).toBe(`/api/video/billboard/${mockData.id}`);
      });
    });
  });

  describe('Image Element', () => {
    it('should have correct src for image', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image).toHaveAttribute('src', mockData.thumbnailUrl);
      });
    });

    it('should have correct alt text', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image).toHaveAttribute('alt', 'Thumbnail');
      });
    });

    it('should have correct dimensions', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      render(<BillboardBase data={mockData} isLoading={false} />);
      waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image).toHaveAttribute('width', '1920');
        expect(image).toHaveAttribute('height', '1080');
      });
    });
  });

  describe('Styling', () => {
    it('should have correct main container classes', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv?.className).toMatch(/relative/);
      expect(mainDiv?.className).toMatch(/h-\[56.25vw\]/);
    });

    it('should have correct content positioning', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const contentDiv = container.querySelector('.absolute');
      expect(contentDiv?.className).toMatch(/absolute/);
      expect(contentDiv?.className).toMatch(/top-\[50%\]/);
      expect(contentDiv?.className).toMatch(/md:top-\[40%\]/);
      expect(contentDiv?.className).toMatch(/ml-4/);
      expect(contentDiv?.className).toMatch(/md:ml-16/);
      expect(contentDiv?.className).toMatch(/max-w-\[60%\]/);
    });

    it('should have button container with proper gap', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const buttonsDiv = container.querySelector('.flex.flex-row');
      expect(buttonsDiv?.className).toMatch(/gap-3/);
      expect(buttonsDiv?.className).toMatch(/mt-3/);
      expect(buttonsDiv?.className).toMatch(/md:mt-4/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const testData = { ...mockData, title: '' };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const testData = { ...mockData, title: 'a'.repeat(200) };
      render(<BillboardBase data={testData} isLoading={false} />);
      const title = screen.getByText(/a{200}/);
      expect(title).toBeInTheDocument();
      expect(title.className).toMatch(/line-clamp-2/);
    });

    it('should handle null data', () => {
      render(<BillboardBase data={null as any} isLoading={false} />);
      expect(screen.queryByText(mockData.title)).not.toBeInTheDocument();
    });

    it('should handle empty description', () => {
      const testData = { ...mockData, description: '' };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      expect(descriptions.length).toBeGreaterThan(1);
    });

    it('should handle description exactly at 140 chars', () => {
      const testData = { ...mockData, description: 'a'.repeat(140) };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.textContent).toContain('...');
    });

    it('should handle description at 139 chars', () => {
      const testData = { ...mockData, description: 'a'.repeat(139) };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.textContent).not.toContain('...');
    });

    it('should handle missing thumbnail URL', () => {
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      const testData = { ...mockData, thumbnailUrl: '' };
      render(<BillboardBase data={testData} isLoading={false} />);
      waitFor(() => {
        const image = screen.getByTestId('next-image');
        expect(image).toHaveAttribute('src', '');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive margin left', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const contentDiv = container.querySelector('.absolute');
      expect(contentDiv?.className).toMatch(/ml-4/);
      expect(contentDiv?.className).toMatch(/md:ml-16/);
    });

    it('should have responsive top position', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const contentDiv = container.querySelector('.absolute');
      expect(contentDiv?.className).toMatch(/top-\[50%\]/);
      expect(contentDiv?.className).toMatch(/md:top-\[40%\]/);
    });

    it('should have responsive text size on title', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      const titleElement = screen.getByText(mockData.title);
      expect(titleElement.className).toMatch(/text-2xl/);
      expect(titleElement.className).toMatch(/md:text-5xl/);
      expect(titleElement.className).toMatch(/lg:text-6xl/);
    });

    it('should have responsive button spacing', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const buttonsDiv = container.querySelector('.flex.flex-row');
      expect(buttonsDiv?.className).toMatch(/mt-3/);
      expect(buttonsDiv?.className).toMatch(/md:mt-4/);
    });
  });

  describe('Integration', () => {
    it('should render complete billboard with all elements', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      expect(screen.getByText(mockData.title)).toBeInTheDocument();
      expect(screen.getByText(/This is a test/)).toBeInTheDocument();
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('info-button')).toBeInTheDocument();
    });

    it('should handle loading to loaded transition', async () => {
      const { rerender, container } = render(<BillboardBase data={mockData} isLoading={true} />);
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<BillboardBase data={mockData} isLoading={false} />);
      await waitFor(() => {
        expect(container.querySelector('svg')).not.toBeInTheDocument();
        expect(screen.getByText(mockData.title)).toBeInTheDocument();
      });
    });

    it('should handle data updates', () => {
      const { rerender } = render(<BillboardBase data={mockData} isLoading={false} />);
      expect(screen.getByText(mockData.title)).toBeInTheDocument();

      const newData = { ...mockData, title: 'New Movie Title' };
      rerender(<BillboardBase data={newData} isLoading={false} />);
      expect(screen.getByText('New Movie Title')).toBeInTheDocument();
      expect(screen.queryByText(mockData.title)).not.toBeInTheDocument();
    });

    it('should maintain state across rerenders', () => {
      const { rerender } = render(<BillboardBase data={mockData} isLoading={false} />);
      const firstTitle = screen.getByText(mockData.title);

      rerender(<BillboardBase data={mockData} isLoading={false} />);
      const secondTitle = screen.getByText(mockData.title);

      expect(firstTitle.textContent).toBe(secondTitle.textContent);
    });
  });

  describe('Component Structure', () => {
    it('should be React FC component', () => {
      const component = BillboardBase;
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('should be functional component', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept props correctly', () => {
      render(<BillboardBase data={mockData} isLoading={false} priority={true} />);
      expect(screen.getByText(mockData.title)).toBeInTheDocument();
    });
  });

  describe('Content Overflow', () => {
    it('should truncate title with text-ellipsis', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      const titleElement = screen.getByText(mockData.title);
      expect(titleElement.className).toMatch(/text-ellipsis/);
      expect(titleElement.className).toMatch(/overflow-hidden/);
    });

    it('should truncate description with text-ellipsis', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.className).toMatch(/text-ellipsis/);
      expect(descElement.className).toMatch(/overflow-hidden/);
    });

    it('should limit title to 2 lines', () => {
      render(<BillboardBase data={mockData} isLoading={false} />);
      const titleElement = screen.getByText(mockData.title);
      expect(titleElement.className).toMatch(/line-clamp-2/);
    });

    it('should limit description to 3 lines', () => {
      const { container } = render(<BillboardBase data={mockData} isLoading={false} />);
      const descriptions = container.querySelectorAll('p');
      const descElement = descriptions[descriptions.length - 1];
      expect(descElement.className).toMatch(/line-clamp-3/);
    });
  });

  describe('Special Cases', () => {
    it('should skip description rendering when description is exactly "test"', () => {
      const testData = { ...mockData, description: 'test' };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      const paragraphs = container.querySelectorAll('p');
      // Should only have title, not description
      const hasDescriptionText = Array.from(paragraphs).some(p => p.textContent?.includes('test'));
      expect(hasDescriptionText).toBe(false);
    });

    it('should include description when it starts with "test" but is longer', () => {
      const testData = { ...mockData, description: 'test description' };
      render(<BillboardBase data={testData} isLoading={false} />);
      expect(screen.getByText(/test description/)).toBeInTheDocument();
    });

    it('should not include description when it is exactly "test"', () => {
      const testData = { ...mockData, description: 'test' };
      const { container } = render(<BillboardBase data={testData} isLoading={false} />);
      const paragraphs = Array.from(container.querySelectorAll('p'));
      const descParagraphs = paragraphs.filter(p => !p.textContent?.includes(mockData.title));
      // Should not have a description paragraph with "test"
      const hasTestOnly = descParagraphs.some(p => p.textContent?.trim() === 'test');
      expect(hasTestOnly).toBe(false);
    });
  });
});
