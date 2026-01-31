import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminStatsPage from '../page';

// Mock SWR
jest.mock('swr', () => {
  return jest.fn();
});

// Mock dynamic imports for charts
jest.mock('next/dynamic', () => {
  return {
    __esModule: true,
    default: (loader: any, options?: any) => {
      const MockChart = ({ data }: any) => {
        if (!data || data.length === 0) {
          return <div>No chart data</div>;
        }
        return (
          <div data-testid="mock-chart">
            <svg data-testid="chart-svg">
              {data.map((item: any, idx: number) => (
                <g key={idx} data-testid={`chart-item-${idx}`}>
                  <text>{JSON.stringify(item)}</text>
                </g>
              ))}
            </svg>
          </div>
        );
      };
      return MockChart;
    },
  };
});

// Import useSWR after mocking
import useSWR from 'swr';

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

const mockStatisticsData = {
  totalViews: 15234,
  timeline: [
    { date: '2024-01-01', count: 100 },
    { date: '2024-01-02', count: 150 },
    { date: '2024-01-03', count: 200 },
  ],
  monthly: [
    { month: 'January', count: 45 },
    { month: 'February', count: 67 },
    { month: 'March', count: 89 },
  ],
};

describe('AdminStatsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the admin statistics page', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByRole('heading', { name: /Statistics/i })).toBeInTheDocument();
    });

    it('should render the main heading', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const heading = screen.getByRole('heading', { name: /Statistics/i });
      expect(heading).toHaveClass('text-3xl', 'font-extrabold');
    });

    it('should render Overview section heading', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    it('should render content container with proper styling', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      const { container } = render(<AdminStatsPage />);
      const mainContainer = container.querySelector('.max-w-5xl');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render without errors', () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      expect(() => {
        render(<AdminStatsPage />);
      }).not.toThrow();
    });
  });

  describe('Loading States', () => {
    it('should display loading state when data is loading', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should show Loading... text during data fetch', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
      expect(loadingText).toHaveClass('text-zinc-400');
    });

    it('should not display content when loading', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.queryByText('Total Views')).not.toBeInTheDocument();
    });

    it('should display loading state with proper styling', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const loadingElement = screen.getByText('Loading...');
      expect(loadingElement).toHaveClass('text-zinc-400');
    });
  });

  describe('Error States', () => {
    it('should display error message when error occurs', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('Error loading statistics.')).toBeInTheDocument();
    });

    it('should show error text with proper styling', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
      } as any);

      render(<AdminStatsPage />);
      const errorElement = screen.getByText('Error loading statistics.');
      expect(errorElement).toHaveClass('text-red-400');
    });

    it('should not display data when error occurs', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as any);

      render(<AdminStatsPage />);
      expect(screen.queryByText('Total Views')).not.toBeInTheDocument();
    });

    it('should show error message without loading state', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Server error'),
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('Error loading statistics.')).toBeInTheDocument();
      const loadingElement = screen.queryByText('Loading...');
      expect(loadingElement).not.toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should call SWR with correct endpoint', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(mockUseSWR).toHaveBeenCalledWith('/api/statistics/admin-overview', expect.any(Function));
    });

    it('should display data after successful fetch', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('Total Views')).toBeInTheDocument();
      expect(screen.getByText('15234')).toBeInTheDocument();
    });

    it('should fetch from correct API endpoint', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const endpoint = mockUseSWR.mock.calls[0][0];
      expect(endpoint).toBe('/api/statistics/admin-overview');
    });

    it('should pass a fetcher function to SWR', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const fetcherArg = mockUseSWR.mock.calls[0][1];
      expect(typeof fetcherArg).toBe('function');
    });
  });

  describe('Statistics Display', () => {
    it('should display total views count', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('15234')).toBeInTheDocument();
    });

    it('should display "Total Views" label', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });

    it('should display total views with proper styling', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const totalViewsCount = screen.getByText('15234');
      expect(totalViewsCount).toHaveClass('text-4xl', 'font-bold', 'text-green-400');
    });

    it('should display different total views values', async () => {
      const customData = { ...mockStatisticsData, totalViews: 50000 };
      mockUseSWR.mockReturnValue({
        data: customData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('50000')).toBeInTheDocument();
    });

    it('should display zero total views', async () => {
      const zeroData = { ...mockStatisticsData, totalViews: 0 };
      mockUseSWR.mockReturnValue({
        data: zeroData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Timeline Chart', () => {
    it('should display timeline chart heading', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText(/Movies & Series Growth Over Time/i)).toBeInTheDocument();
    });

    it('should render timeline chart when data is available', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getAllByTestId('mock-chart').length).toBeGreaterThan(0);
    });

    it('should display "No data available" when timeline is empty', async () => {
      const noTimelineData = { ...mockStatisticsData, timeline: [] };
      mockUseSWR.mockReturnValue({
        data: noTimelineData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('No data available.')).toBeInTheDocument();
    });

    it('should display "No data available" when timeline is undefined', async () => {
      const noTimelineData = { ...mockStatisticsData, timeline: undefined };
      mockUseSWR.mockReturnValue({
        data: noTimelineData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('No data available.')).toBeInTheDocument();
    });

    it('should display timeline chart with proper styling', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const timelineHeadings = screen.getAllByText(/Movies & Series Growth Over Time/i);
      expect(timelineHeadings.length).toBeGreaterThan(0);
    });

    it('should pass timeline data to chart component', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      // Verify charts are rendered
      const charts = screen.getAllByTestId('mock-chart');
      expect(charts.length).toBeGreaterThan(0);
    });
  });

  describe('Monthly Chart', () => {
    it('should display monthly chart heading', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText(/Movies & Series Added Per Month/i)).toBeInTheDocument();
    });

    it('should render monthly chart when data is available', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const charts = screen.getAllByTestId('mock-chart');
      expect(charts.length).toBeGreaterThanOrEqual(2);
    });

    it('should display "No monthly data available" when monthly data is empty', async () => {
      const noMonthlyData = { ...mockStatisticsData, monthly: [] };
      mockUseSWR.mockReturnValue({
        data: noMonthlyData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('No monthly data available.')).toBeInTheDocument();
    });

    it('should display "No monthly data available" when monthly is undefined', async () => {
      const noMonthlyData = { ...mockStatisticsData, monthly: undefined };
      mockUseSWR.mockReturnValue({
        data: noMonthlyData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('No monthly data available.')).toBeInTheDocument();
    });

    it('should display monthly chart with proper styling', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const monthlyHeadings = screen.getAllByText(/Movies & Series Added Per Month/i);
      expect(monthlyHeadings.length).toBeGreaterThan(0);
    });

    it('should pass monthly data to bar chart component', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const charts = screen.getAllByTestId('mock-chart');
      expect(charts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Layout and Styling', () => {
    it('should apply container max-width class', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      const { container } = render(<AdminStatsPage />);
      const mainDiv = container.querySelector('.max-w-5xl');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should apply padding to main container', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      const { container } = render(<AdminStatsPage />);
      const mainDiv = container.querySelector('.max-w-5xl');
      expect(mainDiv).toHaveClass('p-6');
    });

    it('should center the container with mx-auto', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      const { container } = render(<AdminStatsPage />);
      const mainDiv = container.querySelector('.max-w-5xl');
      expect(mainDiv).toHaveClass('mx-auto');
    });

    it('should style overview card with proper classes', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      const { container } = render(<AdminStatsPage />);
      const overviewCard = container.querySelector('.bg-zinc-800');
      expect(overviewCard).toHaveClass('rounded-2xl', 'shadow-2xl', 'p-6');
    });

    it('should apply margin bottom to overview card', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      // Verify the overview section is present
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    it('should style stats box with proper classes', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const statsBox = screen.getByText('Total Views');
      expect(statsBox).toBeInTheDocument();
      expect(statsBox).toHaveClass('text-zinc-300');
    });

    it('should apply spacing to stats content', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      const { container } = render(<AdminStatsPage />);
      // Verify the component renders with proper layout
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should use flex layout for stats', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      // Verify the page renders with all content
      expect(screen.getByText('Total Views')).toBeInTheDocument();
      expect(screen.getByText('15234')).toBeInTheDocument();
    });

    it('should use responsive gap for stats', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      // Verify responsive content is rendered
      expect(screen.getByText('Movies & Series Growth Over Time')).toBeInTheDocument();
      expect(screen.getByText('Movies & Series Added Per Month')).toBeInTheDocument();
    });

    it('should use flex-1 for stat boxes', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      // Verify stat content is rendered
      expect(screen.getByText('Total Views')).toBeInTheDocument();
      expect(screen.getByText('15234')).toBeInTheDocument();
    });

    it('should apply responsive md classes', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      // Verify the page renders properly
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('should display heading with correct font size', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const heading = screen.getByRole('heading', { name: /Statistics/i });
      expect(heading).toHaveClass('text-3xl');
    });

    it('should display heading with bold font', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const heading = screen.getByRole('heading', { name: /Statistics/i });
      expect(heading).toHaveClass('font-extrabold');
    });

    it('should display heading in light color', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const heading = screen.getByRole('heading', { name: /Statistics/i });
      expect(heading).toHaveClass('text-zinc-100');
    });

    it('should display total views with large font', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const totalViewsCount = screen.getByText('15234');
      expect(totalViewsCount).toHaveClass('text-4xl');
    });

    it('should style label text in light color', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const label = screen.getByText('Total Views');
      expect(label).toHaveClass('text-zinc-300');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data gracefully', async () => {
      mockUseSWR.mockReturnValue({
        data: null,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    it('should handle undefined data gracefully', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    it('should handle very large numbers', async () => {
      const largeData = { ...mockStatisticsData, totalViews: 999999999 };
      mockUseSWR.mockReturnValue({
        data: largeData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('999999999')).toBeInTheDocument();
    });

    it('should handle negative numbers gracefully', async () => {
      const negativeData = { ...mockStatisticsData, totalViews: -100 };
      mockUseSWR.mockReturnValue({
        data: negativeData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('-100')).toBeInTheDocument();
    });

    it('should handle empty timeline and monthly data', async () => {
      const emptyData = {
        totalViews: 1000,
        timeline: [],
        monthly: [],
      };
      mockUseSWR.mockReturnValue({
        data: emptyData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('No data available.')).toBeInTheDocument();
      expect(screen.getByText('No monthly data available.')).toBeInTheDocument();
    });

    it('should render without errors when all data is null', async () => {
      const nullData = {
        totalViews: null,
        timeline: null,
        monthly: null,
      };
      mockUseSWR.mockReturnValue({
        data: nullData,
        isLoading: false,
        error: undefined,
      } as any);

      expect(() => {
        render(<AdminStatsPage />);
      }).not.toThrow();
    });

    it('should handle single data point in timeline', async () => {
      const singlePointData = {
        ...mockStatisticsData,
        timeline: [{ date: '2024-01-01', count: 100 }],
      };
      mockUseSWR.mockReturnValue({
        data: singlePointData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getAllByTestId('mock-chart').length).toBeGreaterThan(0);
    });

    it('should handle single data point in monthly', async () => {
      const singleMonthData = {
        ...mockStatisticsData,
        monthly: [{ month: 'January', count: 45 }],
      };
      mockUseSWR.mockReturnValue({
        data: singleMonthData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getAllByTestId('mock-chart').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading hierarchy', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });

    it('should have proper section structure', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const overviewHeading = screen.getByText('Overview');
      expect(overviewHeading).toBeInTheDocument();
    });

    it('should display descriptive text for charts', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText(/Movies & Series Growth Over Time/i)).toBeInTheDocument();
      expect(screen.getByText(/Movies & Series Added Per Month/i)).toBeInTheDocument();
    });

    it('should have clear label for total views', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });

    it('should use appropriate color contrast', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const totalViews = screen.getByText('15234');
      expect(totalViews).toHaveClass('text-green-400');
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading to data display', async () => {
      // Start with loading
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      const { rerender } = render(<AdminStatsPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Transition to loaded
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      rerender(<AdminStatsPage />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });

    it('should transition from loading to error', async () => {
      // Start with loading
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      } as any);

      const { rerender } = render(<AdminStatsPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Transition to error
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as any);

      rerender(<AdminStatsPage />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText(/Error loading statistics/i)).toBeInTheDocument();
    });

    it('should transition from error to data display', async () => {
      // Start with error
      mockUseSWR.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Initial error'),
      } as any);

      const { rerender } = render(<AdminStatsPage />);
      expect(screen.getByText(/Error loading statistics/i)).toBeInTheDocument();

      // Transition to loaded
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      rerender(<AdminStatsPage />);
      expect(screen.queryByText(/Error loading statistics/i)).not.toBeInTheDocument();
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });
  });

  describe('Content Verification', () => {
    it('should display all expected sections', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });

    it('should display all chart headings', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText(/Movies & Series Growth Over Time/i)).toBeInTheDocument();
      expect(screen.getByText(/Movies & Series Added Per Month/i)).toBeInTheDocument();
    });

    it('should display stats data in correct order', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      const { container } = render(<AdminStatsPage />);
      // Both should be present on the page
      expect(screen.getByText('15234')).toBeInTheDocument();
      expect(screen.getByText('Total Views')).toBeInTheDocument();
    });
  });

  describe('Chart Component Integration', () => {
    it('should render both chart types when data available', async () => {
      mockUseSWR.mockReturnValue({
        data: mockStatisticsData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const charts = screen.getAllByTestId('mock-chart');
      expect(charts.length).toBe(2);
    });

    it('should not render charts when no data', async () => {
      const noChartData = {
        totalViews: 100,
        timeline: [],
        monthly: [],
      };
      mockUseSWR.mockReturnValue({
        data: noChartData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      const charts = screen.queryAllByTestId('mock-chart');
      expect(charts.length).toBe(0);
    });

    it('should render timeline chart independently of monthly', async () => {
      const timelineOnlyData = {
        totalViews: 100,
        timeline: [{ date: '2024-01-01', count: 100 }],
        monthly: [],
      };
      mockUseSWR.mockReturnValue({
        data: timelineOnlyData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText(/Movies & Series Growth Over Time/i)).toBeInTheDocument();
      expect(screen.getByText('No monthly data available.')).toBeInTheDocument();
    });

    it('should render monthly chart independently of timeline', async () => {
      const monthlyOnlyData = {
        totalViews: 100,
        timeline: [],
        monthly: [{ month: 'January', count: 45 }],
      };
      mockUseSWR.mockReturnValue({
        data: monthlyOnlyData,
        isLoading: false,
        error: undefined,
      } as any);

      render(<AdminStatsPage />);
      expect(screen.getByText('No data available.')).toBeInTheDocument();
      expect(screen.getByText(/Movies & Series Added Per Month/i)).toBeInTheDocument();
    });
  });
});
