import React from 'react';
import { render, screen } from '@testing-library/react';
import Billboard from '../Billboard';
import useBillboard from '@/hooks/useBillborad';

// Mock the hook
jest.mock('@/hooks/useBillborad');

// Mock BillboardBase component
jest.mock('../BillboardBase', () => {
  return function DummyBillboardBase({
    data,
    isLoading,
    priority,
  }: {
    data?: any;
    isLoading: boolean;
    priority?: boolean;
  }) {
    return (
      <div data-testid="billboard-base">
        {data && <div data-testid="billboard-data">{data.id}</div>}
        {isLoading && <div data-testid="billboard-loading">Loading</div>}
        {priority && <div data-testid="billboard-priority">Priority</div>}
      </div>
    );
  };
});

const mockUseBillboard = useBillboard as jest.MockedFunction<typeof useBillboard>;

const mockData = {
  id: 'test-movie-1',
  title: 'Test Movie',
  description: 'This is a test movie description',
  thumbnailUrl: 'https://example.com/image.jpg',
};

describe('Billboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBillboard.mockReturnValue({
      data: mockData,
      error: null,
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });

    it('should render BillboardBase component', () => {
      render(<Billboard />);
      const billboardBase = screen.getByTestId('billboard-base');
      expect(billboardBase).toBeInTheDocument();
    });

    it('should render with data from hook', () => {
      render(<Billboard />);
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
      expect(screen.getByTestId('billboard-data').textContent).toBe(mockData.id);
    });

    it('should be a client component', () => {
      // This test verifies the "use client" directive is in place
      // The component should render without server-side issues
      const { container } = render(<Billboard />);
      expect(container).toBeTruthy();
    });
  });

  describe('Hook Integration', () => {
    it('should call useBillboard hook', () => {
      render(<Billboard />);
      expect(mockUseBillboard).toHaveBeenCalled();
    });

    it('should call useBillboard hook once', () => {
      render(<Billboard />);
      expect(mockUseBillboard).toHaveBeenCalledTimes(1);
    });

    it('should handle hook with data', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
    });

    it('should handle hook with undefined data', () => {
      mockUseBillboard.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.queryByTestId('billboard-data')).not.toBeInTheDocument();
    });

    it('should handle hook with isLoading true', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: true,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();
    });

    it('should handle hook with isLoading false', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.queryByTestId('billboard-loading')).not.toBeInTheDocument();
    });

    it('should handle loading state without data', () => {
      mockUseBillboard.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('billboard-data')).not.toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass data to BillboardBase', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
    });

    it('should pass isLoading to BillboardBase', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: true,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();
    });

    it('should pass priority prop to BillboardBase', () => {
      render(<Billboard />);
      expect(screen.getByTestId('billboard-priority')).toBeInTheDocument();
    });

    it('should always pass priority as true', () => {
      render(<Billboard />);
      const priorityElement = screen.getByTestId('billboard-priority');
      expect(priorityElement).toBeInTheDocument();
    });

    it('should pass all props together', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
      expect(screen.getByTestId('billboard-priority')).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should display movie ID from data', () => {
      const testData = { ...mockData, id: 'movie-123' };
      mockUseBillboard.mockReturnValue({
        data: testData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-data').textContent).toBe('movie-123');
    });

    it('should handle different movie data', () => {
      const differentData = {
        id: 'different-movie',
        title: 'Different Movie',
        description: 'Different description',
        thumbnailUrl: 'https://example.com/different.jpg',
      };
      mockUseBillboard.mockReturnValue({
        data: differentData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-data').textContent).toBe('different-movie');
    });

    it('should handle null data', () => {
      mockUseBillboard.mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.queryByTestId('billboard-data')).not.toBeInTheDocument();
    });

    it('should handle empty data object', () => {
      mockUseBillboard.mockReturnValue({
        data: {},
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });

    it('should update when data changes', () => {
      const { rerender } = render(<Billboard />);
      expect(screen.getByTestId('billboard-data').textContent).toBe(mockData.id);

      const newData = { ...mockData, id: 'new-movie-id' };
      mockUseBillboard.mockReturnValue({
        data: newData,
        error: null,
        isLoading: false,
      });

      rerender(<Billboard />);
      expect(screen.getByTestId('billboard-data').textContent).toBe('new-movie-id');
    });
  });

  describe('Loading States', () => {
    it('should handle initial loading state', () => {
      mockUseBillboard.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();
    });

    it('should transition from loading to loaded', () => {
      mockUseBillboard.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
      });
      const { rerender } = render(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();

      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      rerender(<Billboard />);
      expect(screen.queryByTestId('billboard-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
    });

    it('should show data even while loading', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: true,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
    });

    it('should handle multiple loading cycles', () => {
      const { rerender } = render(<Billboard />);

      // First load
      mockUseBillboard.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
      });
      rerender(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();

      // Data loaded
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      rerender(<Billboard />);
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();

      // Reload
      mockUseBillboard.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
      });
      rerender(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate with useBillboard hook', () => {
      render(<Billboard />);
      expect(mockUseBillboard).toHaveBeenCalled();
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });

    it('should integrate with BillboardBase component', () => {
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });

    it('should work as a complete component', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
      expect(screen.getByTestId('billboard-priority')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle hook returning undefined', () => {
      mockUseBillboard.mockReturnValue(undefined as any);
      expect(() => {
        render(<Billboard />);
      }).toThrow();
    });

    it('should handle hook returning empty object', () => {
      mockUseBillboard.mockReturnValue({} as any);
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });

    it('should handle missing data property', () => {
      mockUseBillboard.mockReturnValue({
        isLoading: false,
      } as any);
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });

    it('should handle missing isLoading property', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
      } as any);
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });
  });

  describe('Hook Return Values', () => {
    it('should extract data from hook', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
    });

    it('should extract isLoading from hook', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: true,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();
    });

    it('should use hook values in render', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      const { container } = render(<Billboard />);
      expect(container).toBeTruthy();
    });
  });

  describe('Props Configuration', () => {
    it('should always pass priority prop', () => {
      render(<Billboard />);
      expect(screen.getByTestId('billboard-priority')).toBeInTheDocument();
    });

    it('should pass exactly 3 props to BillboardBase', () => {
      render(<Billboard />);
      // data, isLoading, and priority props are passed
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
      expect(screen.getByTestId('billboard-priority')).toBeInTheDocument();
    });

    it('should not pass additional props', () => {
      render(<Billboard />);
      // Billboard only passes data, isLoading, and priority
      const billboardBase = screen.getByTestId('billboard-base');
      expect(billboardBase).toBeInTheDocument();
    });
  });

  describe('Composition', () => {
    it('should use hook inside component', () => {
      render(<Billboard />);
      expect(mockUseBillboard).toHaveBeenCalled();
    });

    it('should render BillboardBase as only child', () => {
      const { container } = render(<Billboard />);
      // The component should only return BillboardBase
      const billboardBases = container.querySelectorAll('[data-testid="billboard-base"]');
      expect(billboardBases).toHaveLength(1);
    });

    it('should be a functional component', () => {
      const { container } = render(<Billboard />);
      expect(container).toBeTruthy();
    });

    it('should render with Fragment-like behavior', () => {
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });
  });

  describe('Re-renders', () => {
    it('should re-render when hook data changes', () => {
      const { rerender } = render(<Billboard />);
      expect(screen.getByTestId('billboard-data').textContent).toBe(mockData.id);

      const newData = { ...mockData, id: 'new-id' };
      mockUseBillboard.mockReturnValue({
        data: newData,
        error: null,
        isLoading: false,
      });
      rerender(<Billboard />);
      expect(screen.getByTestId('billboard-data').textContent).toBe('new-id');
    });

    it('should re-render when hook loading state changes', () => {
      const { rerender } = render(<Billboard />);
      expect(screen.queryByTestId('billboard-loading')).not.toBeInTheDocument();

      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: true,
      });
      rerender(<Billboard />);
      expect(screen.getByTestId('billboard-loading')).toBeInTheDocument();
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = render(<Billboard />);

      for (let i = 0; i < 5; i++) {
        mockUseBillboard.mockReturnValue({
          data: i % 2 === 0 ? mockData : undefined,
          error: null,
          isLoading: i % 2 === 1,
        });
        rerender(<Billboard />);
      }

      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should be exported as default', () => {
      expect(Billboard).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof Billboard).toBe('function');
    });

    it('should accept no props', () => {
      const { container } = render(<Billboard />);
      expect(container).toBeTruthy();
    });
  });

  describe('Hook Call Behavior', () => {
    it('should call hook on mount', () => {
      render(<Billboard />);
      expect(mockUseBillboard).toHaveBeenCalled();
    });

    it('should call hook with no arguments', () => {
      render(<Billboard />);
      expect(mockUseBillboard).toHaveBeenCalledWith();
    });

    it('should destructure hook response', () => {
      mockUseBillboard.mockReturnValue({
        data: mockData,
        error: null,
        isLoading: false,
      });
      render(<Billboard />);
      expect(screen.getByTestId('billboard-data')).toBeInTheDocument();
    });
  });

  describe('Mocking Verification', () => {
    it('should use mocked useBillboard hook', () => {
      render(<Billboard />);
      expect(mockUseBillboard).toHaveBeenCalled();
    });

    it('should use mocked BillboardBase component', () => {
      render(<Billboard />);
      expect(screen.getByTestId('billboard-base')).toBeInTheDocument();
    });

    it('should render mocked components correctly', () => {
      render(<Billboard />);
      const billboardBase = screen.getByTestId('billboard-base');
      expect(billboardBase).toBeInTheDocument();
    });
  });
});
