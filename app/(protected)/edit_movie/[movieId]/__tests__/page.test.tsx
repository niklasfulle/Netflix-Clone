import React from 'react';
import { render, screen } from '@testing-library/react';
import EditMoviePage from '@/app/(protected)/edit_movie/[movieId]/page';
import * as ReactDeviceDetect from 'react-device-detect';

// Mock dependencies
jest.mock('react-device-detect');
jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

jest.mock('@/app/(protected)/edit_movie/[movieId]/_components/edit-movie-form', () => ({
  EditMovieForm: ({ movie }: any) => (
    <div data-testid="edit-movie-form">
      Edit Movie Form for {movie?.title}
    </div>
  ),
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/hooks/movies/useMovie', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockReactDeviceDetect = ReactDeviceDetect as jest.Mocked<typeof ReactDeviceDetect>;
const mockUseParams = require('next/navigation').useParams;
const mockUseMovie = require('@/hooks/movies/useMovie').default;

describe('Edit Movie Page (app/(protected)/edit_movie/[movieId]/page.tsx)', () => {
  const mockMovie = {
    id: 'movie-123',
    title: 'Test Movie',
    description: 'Test Description',
    videoUrl: 'http://test.com/video.mp4',
    thumbnailUrl: 'http://test.com/thumb.jpg',
    genre: 'Action',
    duration: '120',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ movieId: 'movie-123' });
    mockUseMovie.mockReturnValue({ data: mockMovie });
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should render Navbar', () => {
      render(<EditMoviePage />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('should render Footer', () => {
      render(<EditMoviePage />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render Card component', () => {
      render(<EditMoviePage />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render CardHeader', () => {
      render(<EditMoviePage />);
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('should render CardContent', () => {
      render(<EditMoviePage />);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('should render EditMovieForm', () => {
      render(<EditMoviePage />);
      expect(screen.getByTestId('edit-movie-form')).toBeInTheDocument();
    });

    it('should pass movie data to EditMovieForm', () => {
      render(<EditMoviePage />);
      expect(screen.getByText(/Edit Movie Form for Test Movie/)).toBeInTheDocument();
    });

    it('should render "Edit Movie" heading', () => {
      render(<EditMoviePage />);
      expect(screen.getByText('Edit Movie')).toBeInTheDocument();
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should render desktop layout when not mobile', () => {
      const { container } = render(<EditMoviePage />);
      const desktopLayout = container.querySelector('.py-20');
      expect(desktopLayout).toBeInTheDocument();
    });

    it('should not render mobile layout when on desktop', () => {
      const { container } = render(<EditMoviePage />);
      const mobileLayout = container.querySelector('.h-svh');
      expect(mobileLayout).not.toBeInTheDocument();
    });

    it('should have w-[600px] card width on desktop', () => {
      render(<EditMoviePage />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('w-[600px]');
    });

    it('should have py-20 class on desktop', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.py-20');
      expect(wrapper).toBeTruthy();
    });

    it('should have pt-28 padding on desktop', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.pt-28');
      expect(wrapper).toBeTruthy();
    });

    it('should have pb-32 padding on desktop', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.pb-32');
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = true;
    });

    it('should render mobile layout when on mobile', () => {
      const { container } = render(<EditMoviePage />);
      const mobileLayout = container.querySelector('.h-svh');
      expect(mobileLayout).toBeInTheDocument();
    });

    it('should not render desktop layout when on mobile', () => {
      const { container } = render(<EditMoviePage />);
      const desktopLayout = container.querySelector('.py-20');
      expect(desktopLayout).not.toBeInTheDocument();
    });

    it('should have w-full card width on mobile', () => {
      render(<EditMoviePage />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('w-full');
    });

    it('should have h-svh class on mobile', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.h-svh');
      expect(wrapper).toBeTruthy();
    });

    it('should have pt-40 padding on mobile', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.pt-40');
      expect(wrapper).toBeTruthy();
    });

    it('should have mb-48 margin on mobile', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.mb-48');
      expect(wrapper).toBeTruthy();
    });

    it('should render EditMovieForm on mobile', () => {
      render(<EditMoviePage />);
      expect(screen.getByTestId('edit-movie-form')).toBeInTheDocument();
    });
  });

  describe('Styling and Classes', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should have bg-zinc-800 background on card', () => {
      render(<EditMoviePage />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-zinc-800');
    });

    it('should have text-white class on card', () => {
      render(<EditMoviePage />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('text-white');
    });

    it('should have mt-20 margin on card', () => {
      render(<EditMoviePage />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('mt-20');
    });

    it('should have border-none class on card', () => {
      render(<EditMoviePage />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-none');
    });

    it('should have md:border-solid class on card', () => {
      render(<EditMoviePage />);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('md:border-solid');
    });

    it('should have text-2xl class on heading', () => {
      const { container } = render(<EditMoviePage />);
      const heading = container.querySelector('.text-2xl');
      expect(heading).toBeInTheDocument();
    });

    it('should have font-semibold class on heading', () => {
      const { container } = render(<EditMoviePage />);
      const heading = container.querySelector('.font-semibold');
      expect(heading).toBeInTheDocument();
    });

    it('should have text-center class on heading', () => {
      const { container } = render(<EditMoviePage />);
      const heading = container.querySelector('.text-center');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Movie Data Handling', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should call useParams to get movieId', () => {
      render(<EditMoviePage />);
      expect(mockUseParams).toHaveBeenCalled();
    });

    it('should call useMovie with movieId', () => {
      render(<EditMoviePage />);
      expect(mockUseMovie).toHaveBeenCalledWith('movie-123');
    });

    it('should return null when movie is undefined', () => {
      mockUseMovie.mockReturnValue({ data: undefined });
      const { container } = render(<EditMoviePage />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render Navbar when movie is undefined', () => {
      mockUseMovie.mockReturnValue({ data: undefined });
      render(<EditMoviePage />);
      expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    });

    it('should not render Footer when movie is undefined', () => {
      mockUseMovie.mockReturnValue({ data: undefined });
      render(<EditMoviePage />);
      expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    });

    it('should not render Card when movie is undefined', () => {
      mockUseMovie.mockReturnValue({ data: undefined });
      render(<EditMoviePage />);
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });

    it('should handle movie with different title', () => {
      mockUseMovie.mockReturnValue({
        data: { ...mockMovie, title: 'Another Movie' },
      });
      render(<EditMoviePage />);
      expect(screen.getByText(/Edit Movie Form for Another Movie/)).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should use useParams hook', () => {
      render(<EditMoviePage />);
      expect(mockUseParams).toHaveBeenCalledTimes(1);
    });

    it('should use useMovie hook with correct movieId', () => {
      mockUseParams.mockReturnValue({ movieId: 'test-id-456' });
      render(<EditMoviePage />);
      expect(mockUseMovie).toHaveBeenCalledWith('test-id-456');
    });

    it('should handle different movieId from params', () => {
      mockUseParams.mockReturnValue({ movieId: 'new-movie-789' });
      mockUseMovie.mockReturnValue({
        data: { ...mockMovie, id: 'new-movie-789' },
      });
      render(<EditMoviePage />);
      expect(mockUseMovie).toHaveBeenCalledWith('new-movie-789');
    });
  });

  describe('Component Structure', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should render fragment wrapper', () => {
      const { container } = render(<EditMoviePage />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should render all components in correct order', () => {
      const { container } = render(<EditMoviePage />);
      const elements = Array.from(container.querySelectorAll('[data-testid]'));
      const testIds = elements.map((el) => el.getAttribute('data-testid'));
      expect(testIds[0]).toBe('navbar');
      expect(testIds).toContain('card');
      expect(testIds).toContain('footer');
    });

    it('should have CardHeader before CardContent', () => {
      const { container } = render(<EditMoviePage />);
      const elements = Array.from(container.querySelectorAll('[data-testid]'));
      const testIds = elements.map((el) => el.getAttribute('data-testid'));
      const headerIndex = testIds.indexOf('card-header');
      const contentIndex = testIds.indexOf('card-content');
      expect(headerIndex).toBeLessThan(contentIndex);
    });

    it('should nest EditMovieForm inside CardContent', () => {
      render(<EditMoviePage />);
      const cardContent = screen.getByTestId('card-content');
      const form = screen.getByTestId('edit-movie-form');
      expect(cardContent).toContainElement(form);
    });
  });

  describe('Responsive Design', () => {
    it('should switch layout based on isMobile', () => {
      mockReactDeviceDetect.isMobile = false;
      const { container: desktopContainer } = render(<EditMoviePage />);
      const desktopLayout = desktopContainer.querySelector('.py-20');
      expect(desktopLayout).toBeInTheDocument();

      jest.clearAllMocks();
      mockReactDeviceDetect.isMobile = true;
      const { container: mobileContainer } = render(<EditMoviePage />);
      const mobileLayout = mobileContainer.querySelector('.h-svh');
      expect(mobileLayout).toBeInTheDocument();
    });

    it('should render only one layout at a time', () => {
      mockReactDeviceDetect.isMobile = false;
      const { container } = render(<EditMoviePage />);
      const desktopLayout = container.querySelector('.py-20');
      const mobileLayout = container.querySelector('.h-svh');
      expect(desktopLayout).toBeInTheDocument();
      expect(mobileLayout).not.toBeInTheDocument();
    });

    it('should maintain consistent components across layouts', () => {
      mockReactDeviceDetect.isMobile = false;
      const { rerender } = render(<EditMoviePage />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      mockReactDeviceDetect.isMobile = true;
      rerender(<EditMoviePage />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Layout Classes', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should have flex class on desktop layout', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.flex');
      expect(wrapper).toBeTruthy();
    });

    it('should have items-center class', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.items-center');
      expect(wrapper).toBeTruthy();
    });

    it('should have justify-center class', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.justify-center');
      expect(wrapper).toBeTruthy();
    });

    it('should have px-2 padding', () => {
      const { container } = render(<EditMoviePage />);
      const wrapper = container.querySelector('.px-2');
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should handle null movieId', () => {
      mockUseParams.mockReturnValue({ movieId: null });
      mockUseMovie.mockReturnValue({ data: undefined });
      const { container } = render(<EditMoviePage />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle empty movie object', () => {
      mockUseMovie.mockReturnValue({ data: {} });
      render(<EditMoviePage />);
      expect(screen.getByTestId('edit-movie-form')).toBeInTheDocument();
    });

    it('should handle movie without title', () => {
      mockUseMovie.mockReturnValue({
        data: { ...mockMovie, title: undefined },
      });
      render(<EditMoviePage />);
      expect(screen.getByTestId('edit-movie-form')).toBeInTheDocument();
    });

    it('should handle useMovie returning null data', () => {
      mockUseMovie.mockReturnValue({ data: null });
      const { container } = render(<EditMoviePage />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Component Export', () => {
    it('should export component as default', () => {
      expect(EditMoviePage).toBeDefined();
      expect(typeof EditMoviePage).toBe('function');
    });

    it('should be a React component', () => {
      const result = render(<EditMoviePage />);
      expect(result.container).toBeTruthy();
    });
  });

  describe('Card Header Content', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should have Edit Movie text in header', () => {
      render(<EditMoviePage />);
      const header = screen.getByTestId('card-header');
      expect(header).toHaveTextContent('Edit Movie');
    });

    it('should render heading as paragraph element', () => {
      const { container } = render(<EditMoviePage />);
      const paragraph = container.querySelector('p.text-2xl');
      expect(paragraph).toBeInTheDocument();
    });

    it('should have centered heading', () => {
      const { container } = render(<EditMoviePage />);
      const heading = container.querySelector('.text-center');
      expect(heading).toHaveTextContent('Edit Movie');
    });
  });

  describe('Desktop vs Mobile Differences', () => {
    it('should use different card widths', () => {
      mockReactDeviceDetect.isMobile = false;
      const { container: desktopContainer, unmount } = render(<EditMoviePage />);
      const desktopCard = desktopContainer.querySelector('[data-testid="card"]');
      expect(desktopCard).toHaveClass('w-[600px]');
      unmount();

      mockReactDeviceDetect.isMobile = true;
      const { container: mobileContainer } = render(<EditMoviePage />);
      const mobileCard = mobileContainer.querySelector('[data-testid="card"]');
      expect(mobileCard).toHaveClass('w-full');
    });

    it('should use different padding values', () => {
      mockReactDeviceDetect.isMobile = false;
      const { container: desktopContainer, unmount } = render(<EditMoviePage />);
      expect(desktopContainer.querySelector('.pt-28')).toBeTruthy();
      unmount();

      mockReactDeviceDetect.isMobile = true;
      const { container: mobileContainer } = render(<EditMoviePage />);
      expect(mobileContainer.querySelector('.pt-40')).toBeTruthy();
    });

    it('should use different height classes', () => {
      mockReactDeviceDetect.isMobile = false;
      const { container: desktopContainer, unmount } = render(<EditMoviePage />);
      expect(desktopContainer.querySelector('.py-20')).toBeTruthy();
      unmount();

      mockReactDeviceDetect.isMobile = true;
      const { container: mobileContainer } = render(<EditMoviePage />);
      expect(mobileContainer.querySelector('.h-svh')).toBeTruthy();
    });
  });

  describe('Movie Prop Passing', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should pass complete movie object to form', () => {
      const customMovie = {
        id: 'custom-123',
        title: 'Custom Title',
        description: 'Custom Description',
        videoUrl: 'http://custom.com/video.mp4',
        thumbnailUrl: 'http://custom.com/thumb.jpg',
        genre: 'Drama',
        duration: '90',
      };
      mockUseMovie.mockReturnValue({ data: customMovie });
      render(<EditMoviePage />);
      expect(screen.getByText(/Edit Movie Form for Custom Title/)).toBeInTheDocument();
    });

    it('should update form when movie data changes', () => {
      const { rerender } = render(<EditMoviePage />);
      expect(screen.getByText(/Edit Movie Form for Test Movie/)).toBeInTheDocument();

      mockUseMovie.mockReturnValue({
        data: { ...mockMovie, title: 'Updated Movie' },
      });
      rerender(<EditMoviePage />);
      expect(screen.getByText(/Edit Movie Form for Updated Movie/)).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('should render everything when movie exists', () => {
      mockReactDeviceDetect.isMobile = false;
      render(<EditMoviePage />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('edit-movie-form')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render nothing when movie is undefined', () => {
      mockUseMovie.mockReturnValue({ data: undefined });
      const { container } = render(<EditMoviePage />);
      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    });
  });

  describe('Component Name', () => {
    it('should have correct component name', () => {
      expect(EditMoviePage.name).toBe('Add');
    });
  });
});
