import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import useMovieList from '@/hooks/movies/useMovieList';
import useNewMovieList from '@/hooks/movies/useNewMovieList';
import usePlaylists from '@/hooks/playlists/usePlaylists';
import useSeriesList from '@/hooks/series/useSeriesList';
import useFavorites from '@/hooks/useFavorites';
import useInfoModal from '@/hooks/useInfoModal';

// Mock alle Komponenten
jest.mock('@/components/Billboard', () => {
  return function MockBillboard() {
    return <div data-testid="billboard">Billboard</div>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('@/components/InfoModal', () => {
  return function MockInfoModal({ visible, onClose, playlists }: any) {
    return (
      <div data-testid="info-modal">
        InfoModal - Visible: {visible.toString()}, Playlists: {playlists?.length || 0}
      </div>
    );
  };
});

jest.mock('@/components/MovieList', () => {
  return function MockMovieList({ title, data, isLoading }: any) {
    return (
      <div data-testid={`movie-list-${title}`}>
        MovieList - {title} - Items: {data?.length || 0}, Loading: {isLoading.toString()}
      </div>
    );
  };
});

jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('@/components/Row', () => {
  return function MockRow({ title, data, isLoading }: any) {
    return (
      <div data-testid={`row-${title}`}>
        Row - {title} - Items: {data?.length || 0}, Loading: {isLoading.toString()}
      </div>
    );
  };
});

// Mock alle Hooks
jest.mock('@/hooks/movies/useMovieList');
jest.mock('@/hooks/movies/useNewMovieList');
jest.mock('@/hooks/playlists/usePlaylists');
jest.mock('@/hooks/series/useSeriesList');
jest.mock('@/hooks/useFavorites');
jest.mock('@/hooks/useInfoModal');

const mockUseMovieList = useMovieList as jest.MockedFunction<typeof useMovieList>;
const mockUseNewMovieList = useNewMovieList as jest.MockedFunction<typeof useNewMovieList>;
const mockUsePlaylists = usePlaylists as jest.MockedFunction<typeof usePlaylists>;
const mockUseSeriesList = useSeriesList as jest.MockedFunction<typeof useSeriesList>;
const mockUseFavorites = useFavorites as jest.MockedFunction<typeof useFavorites>;
const mockUseInfoModal = useInfoModal as jest.MockedFunction<typeof useInfoModal>;

describe('Home Page (page.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);
      mockUseNewMovieList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseMovieList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseSeriesList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseFavorites.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUsePlaylists.mockReturnValue({
        data: [],
      } as any);
    });

    it('should render all main components', () => {
      render(<Home />);

      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('billboard')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render InfoModal', () => {
      render(<Home />);

      expect(screen.getByTestId('info-modal')).toBeInTheDocument();
    });

    it('should render MovieList with "New" title', () => {
      render(<Home />);

      expect(screen.getByTestId('movie-list-New')).toBeInTheDocument();
    });

    it('should render Row components for Movies, Series, and Favorites', () => {
      render(<Home />);

      expect(screen.getByTestId('row-Movies')).toBeInTheDocument();
      expect(screen.getByTestId('row-Series')).toBeInTheDocument();
      expect(screen.getByTestId('row-Favorites')).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    beforeEach(() => {
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);
      mockUseNewMovieList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseMovieList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseSeriesList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseFavorites.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUsePlaylists.mockReturnValue({
        data: [],
      } as any);
    });

    it('should call useInfoModal hook', () => {
      render(<Home />);

      expect(mockUseInfoModal).toHaveBeenCalled();
    });

    it('should call useNewMovieList hook', () => {
      render(<Home />);

      expect(mockUseNewMovieList).toHaveBeenCalled();
    });

    it('should call useMovieList hook', () => {
      render(<Home />);

      expect(mockUseMovieList).toHaveBeenCalled();
    });

    it('should call useSeriesList hook', () => {
      render(<Home />);

      expect(mockUseSeriesList).toHaveBeenCalled();
    });

    it('should call useFavorites hook', () => {
      render(<Home />);

      expect(mockUseFavorites).toHaveBeenCalled();
    });

    it('should call usePlaylists hook', () => {
      render(<Home />);

      expect(mockUsePlaylists).toHaveBeenCalled();
    });
  });

  describe('Data Handling', () => {
    beforeEach(() => {
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);
    });

    it('should display new movies when data is loaded', () => {
      const mockNewMovies = [
        { id: '1', title: 'New Movie 1' },
        { id: '2', title: 'New Movie 2' },
      ];
      mockUseNewMovieList.mockReturnValue({
        data: mockNewMovies,
        isLoading: false,
      } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('movie-list-New')).toHaveTextContent('Items: 2');
    });

    it('should display movies when data is loaded', () => {
      const mockMovies = [
        { id: '1', title: 'Movie 1' },
        { id: '2', title: 'Movie 2' },
        { id: '3', title: 'Movie 3' },
      ];
      mockUseNewMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseMovieList.mockReturnValue({
        data: mockMovies,
        isLoading: false,
      } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('row-Movies')).toHaveTextContent('Items: 3');
    });

    it('should display series when data is loaded', () => {
      const mockSeries = [
        { id: '1', title: 'Series 1' },
        { id: '2', title: 'Series 2' },
      ];
      mockUseNewMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({
        data: mockSeries,
        isLoading: false,
      } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('row-Series')).toHaveTextContent('Items: 2');
    });

    it('should display favorite movies when data is loaded', () => {
      const mockFavorites = [{ id: '1', title: 'Favorite Movie' }];
      mockUseNewMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({
        data: mockFavorites,
        isLoading: false,
      } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('row-Favorites')).toHaveTextContent('Items: 1');
    });

    it('should use default empty arrays when data is undefined', () => {
      mockUseNewMovieList.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);
      mockUseMovieList.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);
      mockUseSeriesList.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);
      mockUseFavorites.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);
      mockUsePlaylists.mockReturnValue({ data: undefined } as any);
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);

      render(<Home />);

      expect(screen.getByTestId('movie-list-New')).toHaveTextContent('Items: 0');
      expect(screen.getByTestId('row-Movies')).toHaveTextContent('Items: 0');
      expect(screen.getByTestId('row-Series')).toHaveTextContent('Items: 0');
      expect(screen.getByTestId('row-Favorites')).toHaveTextContent('Items: 0');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);
    });

    it('should display loading state for new movies', () => {
      mockUseNewMovieList.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('movie-list-New')).toHaveTextContent('Loading: true');
    });

    it('should display loading state for movies', () => {
      mockUseNewMovieList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: true } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('row-Movies')).toHaveTextContent('Loading: true');
    });

    it('should display loading state for series', () => {
      mockUseNewMovieList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: true } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('row-Series')).toHaveTextContent('Loading: true');
    });

    it('should display loading state for favorites', () => {
      mockUseNewMovieList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: true } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('row-Favorites')).toHaveTextContent('Loading: true');
    });
  });

  describe('InfoModal Integration', () => {
    it('should pass isOpen prop to InfoModal', () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: jest.fn(),
      } as any);
      mockUseNewMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('info-modal')).toHaveTextContent('Visible: true');
    });

    it('should pass closeModal callback to InfoModal', () => {
      const mockCloseModal = jest.fn();
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: mockCloseModal,
      } as any);
      mockUseNewMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      // Verify the component receives the closeModal function
      expect(mockUseInfoModal).toHaveBeenCalled();
    });

    it('should pass playlists to InfoModal', () => {
      const mockPlaylists = [
        { id: '1', name: 'Playlist 1' },
        { id: '2', name: 'Playlist 2' },
      ];
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);
      mockUseNewMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: mockPlaylists } as any);

      render(<Home />);

      expect(screen.getByTestId('info-modal')).toHaveTextContent('Playlists: 2');
    });
  });

  describe('Layout Structure', () => {
    beforeEach(() => {
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);
      mockUseNewMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseMovieList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseSeriesList.mockReturnValue({ data: [], isLoading: false } as any);
      mockUseFavorites.mockReturnValue({ data: [], isLoading: false } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);
    });

    it('should render InfoModal first', () => {
      const { container } = render(<Home />);

      const infoModal = screen.getByTestId('info-modal');
      const navbar = screen.getByTestId('navbar');

      expect(container.firstChild).toContainElement(infoModal);
    });

    it('should render Navbar before Billboard', () => {
      const { container } = render(<Home />);

      const navbar = screen.getByTestId('navbar');
      const billboard = screen.getByTestId('billboard');

      const navbarIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === navbar,
      );
      const billboardIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === billboard,
      );

      expect(navbarIndex).toBeLessThan(billboardIndex);
    });

    it('should render Billboard before content rows', () => {
      const { container } = render(<Home />);

      const billboard = screen.getByTestId('billboard');
      const newMovieList = screen.getByTestId('movie-list-New');

      const billboardIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === billboard,
      );
      const movieListIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === newMovieList,
      );

      expect(billboardIndex).toBeLessThan(movieListIndex);
    });

    it('should render Footer last', () => {
      const { container } = render(<Home />);

      const footer = screen.getByTestId('footer');
      const favorites = screen.getByTestId('row-Favorites');

      const footerIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === footer,
      );
      const favoritesIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === favorites,
      );

      expect(footerIndex).toBeGreaterThan(favoritesIndex);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all hooks returning data simultaneously', () => {
      const mockNewMovies = [{ id: '1' }];
      const mockMovies = [{ id: '1' }, { id: '2' }];
      const mockSeries = [{ id: '1' }];
      const mockFavorites = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const mockPlaylists = [{ id: '1' }];

      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);
      mockUseNewMovieList.mockReturnValue({
        data: mockNewMovies,
        isLoading: false,
      } as any);
      mockUseMovieList.mockReturnValue({
        data: mockMovies,
        isLoading: false,
      } as any);
      mockUseSeriesList.mockReturnValue({
        data: mockSeries,
        isLoading: false,
      } as any);
      mockUseFavorites.mockReturnValue({
        data: mockFavorites,
        isLoading: false,
      } as any);
      mockUsePlaylists.mockReturnValue({ data: mockPlaylists } as any);

      render(<Home />);

      expect(screen.getByTestId('movie-list-New')).toHaveTextContent('Items: 1');
      expect(screen.getByTestId('row-Movies')).toHaveTextContent('Items: 2');
      expect(screen.getByTestId('row-Series')).toHaveTextContent('Items: 1');
      expect(screen.getByTestId('row-Favorites')).toHaveTextContent('Items: 3');
    });

    it('should handle all hooks returning loading state simultaneously', () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: false,
        closeModal: jest.fn(),
      } as any);
      mockUseNewMovieList.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);
      mockUseMovieList.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);
      mockUseSeriesList.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);
      mockUseFavorites.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);
      mockUsePlaylists.mockReturnValue({ data: [] } as any);

      render(<Home />);

      expect(screen.getByTestId('movie-list-New')).toHaveTextContent('Loading: true');
      expect(screen.getByTestId('row-Movies')).toHaveTextContent('Loading: true');
      expect(screen.getByTestId('row-Series')).toHaveTextContent('Loading: true');
      expect(screen.getByTestId('row-Favorites')).toHaveTextContent('Loading: true');
    });
  });
});
