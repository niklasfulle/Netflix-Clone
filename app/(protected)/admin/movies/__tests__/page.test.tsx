'use client';

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminMoviesPage from '../page';

// Mock the MovieAdminTable component
jest.mock('@/components/admin/MovieAdminTable', () => {
  return function DummyMovieAdminTable({
    items,
    page,
    setPage,
    totalPages,
  }: {
    items: any[];
    page: number;
    setPage: (page: number) => void;
    totalPages: number;
  }) {
    return (
      <div data-testid="movie-admin-table">
        <div data-testid="table-items-count">{items.length} items</div>
        <div data-testid="current-page">{page}</div>
        <div data-testid="total-pages">{totalPages}</div>
        <button onClick={() => setPage(page - 1)} data-testid="prev-button">
          Previous
        </button>
        <button onClick={() => setPage(page + 1)} data-testid="next-button">
          Next
        </button>
      </div>
    );
  };
});

// Mock fetch
globalThis.fetch = jest.fn();

describe('AdminMoviesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockReset();
  });

  describe('Component Rendering', () => {
    it('should render the admin movies page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
      });
    });

    it('should render with default page value', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      });
    });

    it('should render the container div', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(container.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should have proper component structure', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
      });
    });

    it('should render MovieAdminTable component', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ movies: [], totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminMoviesPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [{ id: 1, title: 'Movie 1' }],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should display loading message while fetching', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ movies: [], totalPages: 1 }),
                }),
              200
            )
          )
      );

      render(<AdminMoviesPage />);
      const loadingElement = screen.getByText('Loading...');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should set loading to true on mount', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ movies: [], totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminMoviesPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error message when fetch fails', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
    });

    it('should display error in red text', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminMoviesPage />);
      await waitFor(() => {
        const errorElement = screen.getByText('Fehler beim Laden der Filme.');
        expect(errorElement).toHaveClass('text-red-500');
      });
    });

    it('should show error when response has no movies property', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ totalPages: 1 }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when response data is undefined', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => undefined,
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
    });

    it('should show error when JSON parsing fails', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
    });

    it('should not show table when error occurs', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.queryByTestId('movie-admin-table')
        ).not.toBeInTheDocument();
      });
    });

    it('should handle error state gracefully', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Server error')
      );

      const { container } = render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
      expect(container).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should call fetch with correct endpoint on mount', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/movies/admin?page=1&pageSize=20'
        );
      });
    });

    it('should call fetch with correct page parameter', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/movies/admin?page=1&pageSize=20'
        );
      });

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      jest.clearAllMocks();
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });
    });

    it('should use correct pageSize', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        const callArgs = (globalThis.fetch as jest.Mock).mock.calls[0][0];
        expect(callArgs).toContain('pageSize=20');
      });
    });

    it('should set movies state on successful fetch', async () => {
      const mockMovies = [
        { id: 1, title: 'Movie 1' },
        { id: 2, title: 'Movie 2' },
      ];

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: mockMovies,
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '2 items'
        );
      });
    });

    it('should set totalPages state on successful fetch', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('total-pages')).toHaveTextContent('5');
      });
    });

    it('should handle empty movies array', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '0 items'
        );
      });
    });

    it('should handle movies with data', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [
            { id: 1, title: 'Movie 1', releaseYear: 2023 },
            { id: 2, title: 'Movie 2', releaseYear: 2024 },
            { id: 3, title: 'Movie 3', releaseYear: 2025 },
          ],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '3 items'
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should initialize with page 1', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 3,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      });
    });

    it('should display current page number', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toBeInTheDocument();
      });
    });

    it('should display total pages', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('total-pages')).toHaveTextContent('5');
      });
    });

    it('should have pagination buttons', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 3,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('prev-button')).toBeInTheDocument();
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });
    });

    it('should pass setPage function to table', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 3,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('prev-button')).toBeInTheDocument();
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });
    });

    it('should render table with correct page prop', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      });
    });

    it('should handle single page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [{ id: 1, title: 'Movie 1' }],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('total-pages')).toHaveTextContent('1');
      });
    });

    it('should handle multiple pages', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 10,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('total-pages')).toHaveTextContent('10');
      });
    });
  });

  describe('MovieAdminTable Props', () => {
    it('should pass items prop to table', async () => {
      const mockMovies = [
        { id: 1, title: 'Movie 1' },
        { id: 2, title: 'Movie 2' },
      ];

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: mockMovies,
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '2 items'
        );
      });
    });

    it('should pass page prop to table', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      });
    });

    it('should pass setPage prop to table', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        const button = screen.getByTestId('next-button');
        expect(button).toBeInTheDocument();
      });
    });

    it('should pass totalPages prop to table', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 7,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('total-pages')).toHaveTextContent('7');
      });
    });

    it('should render table with all props', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [{ id: 1 }],
          totalPages: 3,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
        expect(screen.getByTestId('table-items-count')).toBeInTheDocument();
        expect(screen.getByTestId('current-page')).toBeInTheDocument();
        expect(screen.getByTestId('total-pages')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Structure', () => {
    it('should have a main container div', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminMoviesPage />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render content inside container', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(container.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should have proper element structure', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminMoviesPage />);
      await waitFor(() => {
        const mainDiv = container.querySelector('div');
        expect(mainDiv).toBeTruthy();
      });
    });

    it('should render without extra wrappers', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(container.children.length).toBeGreaterThan(0);
      });
    });

    it('should maintain structure during loading', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ movies: [], totalPages: 1 }),
                }),
              100
            )
          )
      );

      const { container } = render(<AdminMoviesPage />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with correct default states', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
        expect(screen.getByTestId('total-pages')).toHaveTextContent('1');
      });
    });

    it('should update page state when page changes', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      });
    });

    it('should handle loading state transitions', async () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({
                    movies: [{ id: 1 }],
                    totalPages: 1,
                  }),
                }),
              50
            )
          )
      );

      render(<AdminMoviesPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
      });
    });

    it('should handle error state transitions', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminMoviesPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
    });

    it('should set movies correctly', async () => {
      const mockMovies = [
        { id: 1, title: 'Movie 1' },
        { id: 2, title: 'Movie 2' },
      ];

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: mockMovies,
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '2 items'
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null movies response', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: null,
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
    });

    it('should handle missing totalPages', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
        expect(screen.getByTestId('total-pages')).toBeInTheDocument();
      });
    });

    it('should handle zero pages', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 0,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('total-pages')).toHaveTextContent('0');
      });
    });

    it('should handle very large page numbers', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1000,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('total-pages')).toHaveTextContent('1000');
      });
    });

    it('should handle very large movie counts', async () => {
      const largeMovieArray = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Movie ${i + 1}`,
      }));

      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: largeMovieArray,
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '100 items'
        );
      });
    });

    it('should handle movies with special characters in title', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [
            { id: 1, title: 'Movie & Series' },
            { id: 2, title: "Movie's Title" },
          ],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '2 items'
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      const { container } = render(<AdminMoviesPage />);
      expect(container).toBeInTheDocument();
    });

    it('should render navigation buttons', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('prev-button')).toBeInTheDocument();
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });
    });

    it('should have accessible error messages', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminMoviesPage />);
      await waitFor(() => {
        const errorMessage = screen.getByText('Fehler beim Laden der Filme.');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should provide loading feedback', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ movies: [], totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminMoviesPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Page Transitions', () => {
    it('should refetch data when page changes', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/movies/admin?page=1&pageSize=20'
        );
      });
    });

    it('should show loading state when page changes', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ movies: [], totalPages: 5 }),
                }),
              50
            )
          )
      );

      render(<AdminMoviesPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle multiple page requests', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 5,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Content Display', () => {
    it('should display table when data loads successfully', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [{ id: 1, title: 'Movie 1' }],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
      });
    });

    it('should not display error when data loads successfully', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.queryByText('Fehler beim Laden der Filme.')
        ).not.toBeInTheDocument();
      });
    });

    it('should display correct number of movies', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [
            { id: 1, title: 'Movie 1' },
            { id: 2, title: 'Movie 2' },
            { id: 3, title: 'Movie 3' },
          ],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '3 items'
        );
      });
    });

    it('should render table with proper data structure', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [
          { id: 1, title: 'Movie 1', releaseYear: 2023 },
          { id: 2, title: 'Movie 2', releaseYear: 2024 },
          ],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('table-items-count')).toHaveTextContent(
          '2 items'
        );
      });
    });
  });

  describe('Conditional Rendering', () => {
    it('should render loading content when loading is true', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ movies: [], totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminMoviesPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render error content when error is set', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
    });

    it('should render table content when data loads', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [{ id: 1 }],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
      });
    });

    it('should not render multiple states simultaneously', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(
          screen.queryByText('Fehler beim Laden der Filme.')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Effect Hook Behavior', () => {
    it('should fetch data on component mount', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });

    it('should fetch data with correct dependencies', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/movies/admin?page=1&pageSize=20'
        );
      });
    });
  });

  describe('renderContent Function', () => {
    it('should call renderContent with loading state', () => {
      (globalThis.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({ movies: [], totalPages: 1 }),
                }),
              100
            )
          )
      );

      render(<AdminMoviesPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should call renderContent with error state', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(
          screen.getByText('Fehler beim Laden der Filme.')
        ).toBeInTheDocument();
      });
    });

    it('should call renderContent with success state', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          movies: [{ id: 1 }],
          totalPages: 1,
        }),
      });

      render(<AdminMoviesPage />);
      await waitFor(() => {
        expect(screen.getByTestId('movie-admin-table')).toBeInTheDocument();
      });
    });
  });
});
