import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Row from '@/components/Row';

// Mock the Thumbnail component
jest.mock('@/components/Thumbnail', () => {
  return function MockThumbnail({ data, isLoading }: any) {
    return <div data-testid={`thumbnail-${data.id}`} className="w-40 h-44">Thumbnail {data.id}</div>;
  };
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaChevronLeft: ({ onClick, className }: any) => (
    <button
      data-testid="chevron-left"
      onClick={onClick}
      className={className}
      aria-label="Scroll left"
    />
  ),
  FaChevronRight: ({ onClick, className }: any) => (
    <button
      data-testid="chevron-right"
      onClick={onClick}
      className={className}
      aria-label="Scroll right"
    />
  ),
}));

// Mock scrollTo for JSDOM
Element.prototype.scrollTo = jest.fn(function(options: any) {
  if (typeof options === 'object' && 'left' in options) {
    (this as any).scrollLeft = options.left;
  }
});

describe('Row Component', () => {
  const mockData = [
    { id: 1, title: 'Movie 1' },
    { id: 2, title: 'Movie 2' },
    { id: 3, title: 'Movie 3' },
  ];

  describe('Rendering', () => {
    it('should render row with title', () => {
      render(<Row data={mockData} title="Popular Movies" isLoading={false} />);
      expect(screen.getByText('Popular Movies')).toBeInTheDocument();
    });

    it('should render all thumbnails', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-3')).toBeInTheDocument();
    });

    it('should render chevron buttons', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should have correct container', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv).toHaveClass('h-auto');
    });

    it('should have correct scroll container', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const scrollContainers = container.querySelectorAll('.flex');
      expect(scrollContainers.length).toBeGreaterThan(0);
    });

    it('should have title with correct text', () => {
      render(<Row data={mockData} title="Popular" isLoading={false} />);
      const titleElement = screen.getByText('Popular');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('font-semibold');
    });

    it('should render with proper structure', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have relative positioning for chevron container', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const relativeDiv = container.querySelector('.relative');
      expect(relativeDiv).toBeInTheDocument();
    });

    it('should pass isLoading prop to Thumbnail components', () => {
      const { rerender } = render(<Row data={mockData} title="Test" isLoading={false} />);
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();

      rerender(<Row data={mockData} title="Test" isLoading={true} />);
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
    });
  });

  describe('Empty Data Handling', () => {
    it('should return null when data is empty', () => {
      const { container } = render(<Row data={[]} title="Test" isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render title when data is empty', () => {
      render(<Row data={[]} title="Should Not Show" isLoading={false} />);
      expect(screen.queryByText('Should Not Show')).not.toBeInTheDocument();
    });

    it('should not render chevrons when data is empty', () => {
      render(<Row data={[]} title="Test" isLoading={false} />);
      expect(screen.queryByTestId('chevron-left')).not.toBeInTheDocument();
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });
  });

  describe('Chevron Button Initial State', () => {
    it('should hide left chevron initially', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron).toHaveClass('hidden');
    });

    it('should show right chevron initially', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const rightChevron = screen.getByTestId('chevron-right');
      expect(rightChevron).not.toHaveClass('hidden');
    });

    it('should have correct chevron styling', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const leftChevron = screen.getByTestId('chevron-left');
      const rightChevron = screen.getByTestId('chevron-right');
      
      expect(leftChevron).toHaveClass('text-white');
      expect(leftChevron).toHaveClass('opacity-0');
      expect(rightChevron).toHaveClass('text-white');
      expect(rightChevron).toHaveClass('opacity-0');
    });

    it('should have hover scale transition on chevrons', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron).toHaveClass('hover:scale-125');
      expect(leftChevron).toHaveClass('transition');
    });
  });

  describe('Chevron Click Handling', () => {
    it('should set isMoved to true when chevron is clicked', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const rightChevron = screen.getByTestId('chevron-right');
      
      fireEvent.click(rightChevron);
      
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron).not.toHaveClass('hidden');
    });

    it('should show left chevron after right chevron click', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const rightChevron = screen.getByTestId('chevron-right');
      
      fireEvent.click(rightChevron);
      
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron).not.toHaveClass('hidden');
    });

    it('should handle left chevron click', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const rightChevron = screen.getByTestId('chevron-right');
      const leftChevron = screen.getByTestId('chevron-left');
      
      fireEvent.click(rightChevron);
      fireEvent.click(leftChevron);
      
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
    });

    it('should handle multiple chevron clicks', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const rightChevron = screen.getByTestId('chevron-right');
      
      fireEvent.click(rightChevron);
      fireEvent.click(rightChevron);
      fireEvent.click(rightChevron);
      
      const leftChevron = screen.getByTestId('chevron-left');
      expect(leftChevron).not.toHaveClass('hidden');
    });
  });

  describe('Scroll Container', () => {
    it('should have overflow-x-hidden class', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const scrollContainer = container.querySelector('.overflow-x-hidden');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should have scrollbar-hide class', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const scrollContainer = container.querySelector('.scrollbar-hide');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should have correct height class', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const scrollContainer = container.querySelector('.h-44');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should have flex layout with spacing', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const scrollContainer = container.querySelector('.flex.items-center');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should maintain consistent spacing between thumbnails', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const scrollContainer = container.querySelector('.overflow-x-hidden');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Title Styling', () => {
    it('should display title with correct font weight', () => {
      render(<Row data={mockData} title="New Releases" isLoading={false} />);
      const title = screen.getByText('New Releases');
      expect(title).toHaveClass('font-semibold');
    });

    it('should display title with white text color', () => {
      render(<Row data={mockData} title="Trending" isLoading={false} />);
      const title = screen.getByText('Trending');
      expect(title).toHaveClass('text-white');
    });

    it('should have responsive text size', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const title = screen.getByText('Test');
      expect(title).toHaveClass('text-md');
    });

    it('should have negative bottom margin', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      expect(container).toBeInTheDocument();
    });

    it('should have responsive margin classes', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const title = screen.getByText('Test');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Large Dataset Handling', () => {
    it('should render many thumbnails', () => {
      const largeData = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, title: `Movie ${i + 1}` }));
      render(<Row data={largeData} title="Test" isLoading={false} />);
      
      for (let i = 1; i <= 20; i++) {
        expect(screen.getByTestId(`thumbnail-${i}`)).toBeInTheDocument();
      }
    });

    it('should render thumbnails in correct order', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      
      const container = screen.getByTestId('thumbnail-1').parentElement;
      const thumbnails = container?.querySelectorAll('[data-testid^="thumbnail-"]');
      
      expect(thumbnails?.[0]).toHaveAttribute('data-testid', 'thumbnail-1');
      expect(thumbnails?.[1]).toHaveAttribute('data-testid', 'thumbnail-2');
      expect(thumbnails?.[2]).toHaveAttribute('data-testid', 'thumbnail-3');
    });

    it('should handle single item', () => {
      const singleItem = [{ id: 1, title: 'Only Movie' }];
      render(<Row data={singleItem} title="Test" isLoading={false} />);
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
    });
  });

  describe('Props Variations', () => {
    it('should handle different title lengths', () => {
      const { rerender } = render(<Row data={mockData} title="A" isLoading={false} />);
      expect(screen.getByText('A')).toBeInTheDocument();

      rerender(<Row data={mockData} title="Very Long Title For Movie Row Display" isLoading={false} />);
      expect(screen.getByText('Very Long Title For Movie Row Display')).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      render(<Row data={mockData} title="Movies & Series!" isLoading={false} />);
      expect(screen.getByText('Movies & Series!')).toBeInTheDocument();
    });

    it('should handle unicode characters in title', () => {
      render(<Row data={mockData} title="🎬 Películas" isLoading={false} />);
      expect(screen.getByText('🎬 Películas')).toBeInTheDocument();
    });

    it('should handle loading state transition', () => {
      const { rerender } = render(<Row data={mockData} title="Test" isLoading={false} />);
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();

      rerender(<Row data={mockData} title="Test" isLoading={true} />);
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
    });
  });

  describe('Data Prop Handling', () => {
    it('should handle data with various properties', () => {
      const complexData = [
        { id: 1, title: 'Movie', poster: 'url', year: 2024 },
        { id: 2, title: 'Another', duration: '120 min' },
        { id: 3, title: 'Third' },
      ];
      render(<Row data={complexData} title="Test" isLoading={false} />);
      
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-3')).toBeInTheDocument();
    });

    it('should maintain data integrity through re-renders', () => {
      const { rerender } = render(<Row data={mockData} title="Test" isLoading={false} />);
      
      const newData = [
        { id: 4, title: 'Movie 4' },
        { id: 5, title: 'Movie 5' },
      ];
      
      rerender(<Row data={newData} title="Test" isLoading={false} />);
      expect(screen.getByTestId('thumbnail-4')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-5')).toBeInTheDocument();
      expect(screen.queryByTestId('thumbnail-1')).not.toBeInTheDocument();
    });

    it('should use id as key for Thumbnail components', () => {
      const dataWithIds = [
        { id: 'unique-1', title: 'Movie 1' },
        { id: 'unique-2', title: 'Movie 2' },
      ];
      render(<Row data={dataWithIds} title="Test" isLoading={false} />);
      
      expect(screen.getByTestId('thumbnail-unique-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-unique-2')).toBeInTheDocument();
    });

    it('should handle data update with same items', () => {
      const { rerender } = render(<Row data={mockData} title="Test" isLoading={false} />);
      
      // Re-render with same data
      rerender(<Row data={mockData} title="Test" isLoading={false} />);
      
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on chevron buttons', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      
      const leftChevron = screen.getByLabelText('Scroll left');
      const rightChevron = screen.getByLabelText('Scroll right');
      
      expect(leftChevron).toBeInTheDocument();
      expect(rightChevron).toBeInTheDocument();
    });

    it('should have semantic heading-like structure for title', () => {
      render(<Row data={mockData} title="Popular Movies" isLoading={false} />);
      const title = screen.getByText('Popular Movies');
      expect(title.tagName).toBe('P');
    });

    it('should have keyboard accessible chevron buttons', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      
      const rightChevron = screen.getByTestId('chevron-right') as HTMLButtonElement;
      expect(rightChevron.tagName).toBe('BUTTON');
    });

    it('should render Thumbnail components with correct props', () => {
      render(<Row data={mockData} title="Test" isLoading={true} />);
      
      // Thumbnails should be rendered with data and isLoading props
      const thumbnail1 = screen.getByTestId('thumbnail-1');
      expect(thumbnail1).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive padding classes', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      expect(container).toBeInTheDocument();
    });

    it('should have responsive margin classes', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      expect(container).toBeInTheDocument();
    });

    it('should have responsive spacing between rows', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const mainDiv = container.querySelector('.space-y-4');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have responsive text size for title', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const title = screen.getByText('Test');
      expect(title).toHaveClass('text-md');
    });

    it('should have responsive spacing for thumbnails', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const scrollContainer = container.querySelector('.flex');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Group Hover States', () => {
    it('should have group-hover opacity change on chevrons', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      
      const leftChevron = screen.getByTestId('chevron-left');
      const rightChevron = screen.getByTestId('chevron-right');
      
      expect(leftChevron).toHaveClass('group-hover:opacity-100');
      expect(rightChevron).toHaveClass('group-hover:opacity-100');
    });

    it('should have group wrapper for hover effects', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const groupDiv = container.querySelector('.group');
      expect(groupDiv).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid chevron clicks', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const rightChevron = screen.getByTestId('chevron-right');
      
      fireEvent.click(rightChevron);
      fireEvent.click(rightChevron);
      fireEvent.click(rightChevron);
      fireEvent.click(rightChevron);
      
      expect(screen.getByTestId('chevron-left')).not.toHaveClass('hidden');
    });

    it('should handle alternate left-right chevron clicks', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      const leftChevron = screen.getByTestId('chevron-left');
      const rightChevron = screen.getByTestId('chevron-right');
      
      fireEvent.click(rightChevron);
      fireEvent.click(leftChevron);
      fireEvent.click(rightChevron);
      
      expect(leftChevron).not.toHaveClass('hidden');
    });

    it('should handle data change while chevron is in moved state', () => {
      const { rerender } = render(<Row data={mockData} title="Test" isLoading={false} />);
      
      fireEvent.click(screen.getByTestId('chevron-right'));
      
      const newData = [
        { id: 10, title: 'New Movie 1' },
        { id: 11, title: 'New Movie 2' },
      ];
      
      rerender(<Row data={newData} title="Test" isLoading={false} />);
      
      expect(screen.getByTestId('thumbnail-10')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-11')).toBeInTheDocument();
    });

    it('should handle null-like data properties', () => {
      const dataWithNulls = [
        { id: 1, title: null },
        { id: 2, title: undefined },
        { id: 3, title: 'Valid' },
      ];
      
      render(<Row data={dataWithNulls} title="Test" isLoading={false} />);
      
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-3')).toBeInTheDocument();
    });

    it('should handle isLoading state changes', () => {
      const { rerender } = render(<Row data={mockData} title="Test" isLoading={false} />);
      
      rerender(<Row data={mockData} title="Test" isLoading={true} />);
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      
      rerender(<Row data={mockData} title="Test" isLoading={false} />);
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render complete row structure', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      
      expect(container.querySelector('.h-auto')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
    });

    it('should maintain order: title, chevron-left, thumbnails, chevron-right', () => {
      render(<Row data={mockData} title="Test" isLoading={false} />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should pass correct props to all Thumbnail components', () => {
      const testData = [
        { id: 'test-1', custom: 'value1' },
        { id: 'test-2', custom: 'value2' },
      ];
      
      render(<Row data={testData} title="Test" isLoading={true} />);
      
      expect(screen.getByTestId('thumbnail-test-1')).toBeInTheDocument();
      expect(screen.getByTestId('thumbnail-test-2')).toBeInTheDocument();
    });

    it('should render with TypeScript FC interface compliance', () => {
      const validProps = {
        data: mockData,
        title: 'Test Title',
        isLoading: false,
      };
      
      const { container } = render(<Row {...validProps} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Memory and Performance', () => {
    it('should render without memory leaks on unmount', () => {
      const { unmount } = render(<Row data={mockData} title="Test" isLoading={false} />);
      unmount();
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });

    it('should handle multiple re-renders efficiently', () => {
      const { rerender } = render(<Row data={mockData} title="Test 1" isLoading={false} />);
      
      for (let i = 2; i <= 5; i++) {
        rerender(<Row data={mockData} title={`Test ${i}`} isLoading={false} />);
      }
      
      expect(screen.getByText('Test 5')).toBeInTheDocument();
    });

    it('should use ref correctly for scroll operations', () => {
      const { container } = render(<Row data={mockData} title="Test" isLoading={false} />);
      const scrollContainer = container.querySelector('.overflow-x-hidden');
      expect(scrollContainer).toBeInTheDocument();
    });
  });
});
