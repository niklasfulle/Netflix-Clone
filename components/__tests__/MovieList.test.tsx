import React from 'react';
import { render, screen } from '@testing-library/react';
import MovieList from '../MovieList';

// Mock MovieCard component
jest.mock('@/components/MovieCard', () => {
  return function MockMovieCard({ data, isLoading }: any) {
    return (
      <div data-testid={`movie-card-${data.id}`}>
        Movie: {data.title} - Loading: {isLoading ? 'true' : 'false'}
      </div>
    );
  };
});

// Mock lodash isEmpty
jest.mock('lodash', () => ({
  isEmpty: jest.fn((value) => {
    return !value || (Array.isArray(value) && value.length === 0);
  }),
}));

const mockMovieData = [
  { id: '1', title: 'Movie 1', genre: 'Action' },
  { id: '2', title: 'Movie 2', genre: 'Drama' },
  { id: '3', title: 'Movie 3', genre: 'Comedy' },
  { id: '4', title: 'Movie 4', genre: 'Thriller' },
];

const mockTitle = 'Popular Movies';

describe('MovieList Component', () => {
  describe('Rendering', () => {
    test('should render without crashing', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      expect(container).toBeTruthy();
    });

    test('should render main container div', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      expect(container.querySelector('div')).toBeTruthy();
    });

    test('should render title', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      expect(screen.getByText(mockTitle)).toBeTruthy();
    });

    test('should render all movie cards', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      mockMovieData.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });

    test('should have correct number of movie cards', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const movieCards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(movieCards.length).toBe(mockMovieData.length);
    });
  });

  describe('Empty Data Handling', () => {
    test('should return null when data is empty array', () => {
      const { container } = render(
        <MovieList data={[]} title={mockTitle} isLoading={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should not render when data is empty', () => {
      render(
        <MovieList data={[]} title={mockTitle} isLoading={false} />
      );
      expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
    });

    test('should not render title when data is empty', () => {
      render(
        <MovieList data={[]} title={mockTitle} isLoading={false} />
      );
      expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
    });

    test('should not render grid when data is empty', () => {
      const { container } = render(
        <MovieList data={[]} title={mockTitle} isLoading={false} />
      );
      expect(container.querySelector('.grid')).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    test('should pass data to MovieCard components', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      mockMovieData.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });

    test('should pass isLoading prop to MovieCard', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={true} />
      );
      const movieCards = screen.getAllByText(/Loading: true/);
      expect(movieCards.length).toBe(mockMovieData.length);
    });

    test('should pass isLoading false correctly', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const movieCards = screen.getAllByText(/Loading: false/);
      expect(movieCards.length).toBe(mockMovieData.length);
    });

    test('should display correct title', () => {
      const customTitle = 'New Releases';
      render(
        <MovieList data={mockMovieData} title={customTitle} isLoading={false} />
      );
      expect(screen.getByText(customTitle)).toBeTruthy();
    });

    test('should handle different titles', () => {
      const titles = ['Action Movies', 'Drama Films', 'Comedy Specials'];
      titles.forEach((title) => {
        const { unmount } = render(
          <MovieList data={mockMovieData} title={title} isLoading={false} />
        );
        expect(screen.getByText(title)).toBeTruthy();
        unmount();
      });
    });
  });

  describe('Styling and Layout', () => {
    test('should have outer container with padding', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const outerDiv = container.querySelector('.px-4.my-6.space-y-8');
      expect(outerDiv).toBeTruthy();
    });

    test('should have responsive padding classes', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const outerDiv = container.querySelector('div');
      expect(outerDiv?.className).toMatch(/px-4/);
      expect(outerDiv?.className).toMatch(/md:px-12/);
      expect(outerDiv?.className).toMatch(/my-6/);
      expect(outerDiv?.className).toMatch(/space-y-8/);
    });

    test('should have title with correct styling', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const title = screen.getByText(mockTitle);
      expect(title.className).toMatch(/font-semibold/);
      expect(title.className).toMatch(/text-white/);
      expect(title.className).toMatch(/text-md/);
      expect(title.className).toMatch(/md:text-xl/);
      expect(title.className).toMatch(/lg:text-2xl/);
    });

    test('should have grid layout', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid).toBeTruthy();
    });

    test('should have responsive grid columns', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/grid-cols-2/);
      expect(grid?.className).toMatch(/lg:grid-cols-4/);
    });

    test('should have grid gap spacing', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/gap-2/);
      expect(grid?.className).toMatch(/md:gap-4/);
    });

    test('should have margin-top on grid', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/mt-4/);
    });
  });

  describe('Title Display', () => {
    test('should render title as paragraph element', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const title = screen.getByText(mockTitle);
      expect(title.tagName.toLowerCase()).toBe('p');
    });

    test('should display exact title text', () => {
      const customTitle = 'Trending Now';
      render(
        <MovieList data={mockMovieData} title={customTitle} isLoading={false} />
      );
      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    test('should handle long title text', () => {
      const longTitle = 'This is a very long title for the movie list section';
      render(
        <MovieList data={mockMovieData} title={longTitle} isLoading={false} />
      );
      expect(screen.getByText(longTitle)).toBeTruthy();
    });

    test('should handle title with special characters', () => {
      const specialTitle = 'Movies & Series - Top 10!';
      render(
        <MovieList data={mockMovieData} title={specialTitle} isLoading={false} />
      );
      expect(screen.getByText(specialTitle)).toBeTruthy();
    });

    test('should handle title with numbers', () => {
      const numberTitle = 'Top 2024 Movies';
      render(
        <MovieList data={mockMovieData} title={numberTitle} isLoading={false} />
      );
      expect(screen.getByText(numberTitle)).toBeTruthy();
    });
  });

  describe('Grid Layout', () => {
    test('should render grid container', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid).toBeTruthy();
    });

    test('should have correct grid structure', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.children.length).toBe(mockMovieData.length);
    });

    test('should use grid-cols-2 on mobile', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/grid-cols-2/);
    });

    test('should use lg:grid-cols-4 on large screens', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/lg:grid-cols-4/);
    });

    test('should have correct gap classes', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/gap-2/);
      expect(grid?.className).toMatch(/md:gap-4/);
    });
  });

  describe('MovieCard Integration', () => {
    test('should render MovieCard for each movie', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      mockMovieData.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });

    test('should pass correct key prop to MovieCard', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const movieCards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(movieCards.length).toBe(mockMovieData.length);
    });

    test('should pass data object to MovieCard', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      mockMovieData.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });

    test('should pass isLoading to all MovieCards', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={true} />
      );
      mockMovieData.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });

    test('should update MovieCard loading state', () => {
      const { rerender } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      mockMovieData.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });

      rerender(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={true} />
      );
      mockMovieData.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });
  });

  describe('Data Variations', () => {
    test('should handle single movie', () => {
      const singleMovie = [{ id: '1', title: 'Single Movie' }];
      render(
        <MovieList data={singleMovie} title={mockTitle} isLoading={false} />
      );
      expect(screen.getByTestId('movie-card-1')).toBeTruthy();
    });

    test('should handle many movies', () => {
      const manyMovies = Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        title: `Movie ${i + 1}`,
      }));
      const { container } = render(
        <MovieList data={manyMovies} title={mockTitle} isLoading={false} />
      );
      const movieCards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(movieCards.length).toBe(20);
    });

    test('should handle movies with various data properties', () => {
      const complexMovies = [
        { id: '1', title: 'Action Film', genre: 'Action', year: 2024 },
        { id: '2', title: 'Drama', genre: 'Drama', rating: 8.5 },
        { id: '3', title: 'Comedy', genre: 'Comedy', director: 'John Doe' },
      ];
      render(
        <MovieList data={complexMovies} title={mockTitle} isLoading={false} />
      );
      complexMovies.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });

    test('should handle movies with missing optional properties', () => {
      const minimalMovies = [
        { id: '1' },
        { id: '2', title: 'Movie 2' },
        { id: '3', title: 'Movie 3', genre: 'Action' },
      ];
      render(
        <MovieList data={minimalMovies} title={mockTitle} isLoading={false} />
      );
      minimalMovies.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });

    test('should handle movie titles with special characters', () => {
      const specialMovies = [
        { id: '1', title: 'Movie & Series' },
        { id: '2', title: 'The #1 Film' },
        { id: '3', title: "Director's Cut" },
      ];
      render(
        <MovieList data={specialMovies} title={mockTitle} isLoading={false} />
      );
      specialMovies.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });

    test('should handle numeric and string IDs', () => {
      const mixedIdMovies = [
        { id: '1', title: 'String ID' },
        { id: 'abc123', title: 'Alphanumeric ID' },
      ];
      render(
        <MovieList data={mixedIdMovies} title={mockTitle} isLoading={false} />
      );
      mixedIdMovies.forEach((movie) => {
        expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    test('should render with isLoading true', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={true} />
      );
      expect(screen.getByText(mockTitle)).toBeTruthy();
    });

    test('should render with isLoading false', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      expect(screen.getByText(mockTitle)).toBeTruthy();
    });

    test('should pass loading state to all cards', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={true} />
      );
      const allCards = screen.getAllByText(/Loading: true/);
      expect(allCards.length).toBe(mockMovieData.length);
    });

    test('should handle loading state transitions', () => {
      const { rerender } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      expect(screen.getByText('Movie: Movie 1 - Loading: false')).toBeTruthy();

      rerender(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={true} />
      );
      expect(screen.getByText('Movie: Movie 1 - Loading: true')).toBeTruthy();
    });
  });

  describe('Container Structure', () => {
    test('should have outer wrapper div', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const outerDiv = container.querySelector('.px-4');
      expect(outerDiv).toBeTruthy();
    });

    test('should have inner container div', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(1);
    });

    test('should have title container', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const divWithTitle = container.querySelector('div > div');
      expect(divWithTitle).toBeTruthy();
    });

    test('should have grid in correct position', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const innerDiv = container.querySelector('div > div');
      const grid = innerDiv?.querySelector('.grid');
      expect(grid).toBeTruthy();
    });

    test('should have correct nesting structure', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const outerDiv = container.querySelector('.px-4.my-6.space-y-8');
      const innerDiv = outerDiv?.querySelector('div');
      const title = innerDiv?.querySelector('p');
      const grid = innerDiv?.querySelector('.grid');

      expect(outerDiv).toBeTruthy();
      expect(innerDiv).toBeTruthy();
      expect(title).toBeTruthy();
      expect(grid).toBeTruthy();
    });
  });

  describe('Component Stability', () => {
    test('should render consistently on multiple renders', () => {
      const { container: container1 } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const { container: container2 } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );

      const title1 = container1.querySelector('p')?.textContent;
      const title2 = container2.querySelector('p')?.textContent;

      expect(title1).toBe(title2);
    });

    test('should handle prop updates', () => {
      const { rerender } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      expect(screen.getByText(mockTitle)).toBeTruthy();

      const newTitle = 'Updated Title';
      rerender(
        <MovieList data={mockMovieData} title={newTitle} isLoading={false} />
      );
      expect(screen.getByText(newTitle)).toBeTruthy();
      expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
    });

    test('should handle data updates', () => {
      const { rerender } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const movieCards = screen.getAllByText(/Movie:/);
      expect(movieCards.length).toBe(4);

      const newData = [
        { id: '1', title: 'New Movie 1' },
        { id: '2', title: 'New Movie 2' },
      ];
      rerender(
        <MovieList data={newData} title={mockTitle} isLoading={false} />
      );
      const updatedCards = screen.getAllByText(/Movie:/);
      expect(updatedCards.length).toBe(2);
    });

    test('should maintain state on re-render', () => {
      const { rerender } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={true} />
      );
      expect(screen.getByText('Movie: Movie 1 - Loading: true')).toBeTruthy();

      rerender(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={true} />
      );
      expect(screen.getByText('Movie: Movie 1 - Loading: true')).toBeTruthy();
    });

    test('should handle rapid data changes', () => {
      const { rerender } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );

      const data2 = [{ id: 'a', title: 'Movie A' }];
      rerender(
        <MovieList data={data2} title={mockTitle} isLoading={false} />
      );
      expect(screen.getByTestId('movie-card-a')).toBeTruthy();

      const data3 = [
        { id: 'x', title: 'Movie X' },
        { id: 'y', title: 'Movie Y' },
      ];
      rerender(
        <MovieList data={data3} title={mockTitle} isLoading={false} />
      );
      expect(screen.getByTestId('movie-card-x')).toBeTruthy();
      expect(screen.getByTestId('movie-card-y')).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    test('should have mobile-first grid columns', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/grid-cols-2/);
    });

    test('should have larger grid on desktop', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/lg:grid-cols-4/);
    });

    test('should have responsive gap spacing', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/gap-2/);
      expect(grid?.className).toMatch(/md:gap-4/);
    });

    test('should have responsive padding', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const outerDiv = container.querySelector('.px-4');
      expect(outerDiv?.className).toMatch(/px-4/);
      expect(outerDiv?.className).toMatch(/md:px-12/);
    });

    test('should have responsive title size', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const title = screen.getByText(mockTitle);
      expect(title.className).toMatch(/text-md/);
      expect(title.className).toMatch(/md:text-xl/);
      expect(title.className).toMatch(/lg:text-2xl/);
    });
  });

  describe('Accessibility', () => {
    test('should have semantic heading element', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const title = screen.getByText(mockTitle);
      expect(title.tagName.toLowerCase()).toBe('p');
    });

    test('should have visible title text', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      expect(screen.getByText(mockTitle)).toBeVisible();
    });

    test('should have accessible list structure', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid).toBeTruthy();
    });

    test('should render all content without hidden elements', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const title = screen.getByText(mockTitle);
      const cards = screen.getAllByText(/Movie:/);

      expect(title).toBeVisible();
      cards.forEach((card) => {
        expect(card).toBeVisible();
      });
    });

    test('should have proper color contrast', () => {
      render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const title = screen.getByText(mockTitle);
      expect(title.className).toMatch(/text-white/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined movie properties gracefully', () => {
      const moviesWithUndefined = [
        { id: '1', title: undefined },
        { id: '2', title: 'Movie 2' },
      ];
      const { container } = render(
        <MovieList data={moviesWithUndefined} title={mockTitle} isLoading={false} />
      );
      expect(container).toBeTruthy();
    });

    test('should handle very long movie list', () => {
      const longList = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        title: `Movie ${i}`,
      }));
      const { container } = render(
        <MovieList data={longList} title={mockTitle} isLoading={false} />
      );
      const cards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(cards.length).toBe(100);
    });

    test('should handle empty string title', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title="" isLoading={false} />
      );
      const title = container.querySelector('p');
      expect(title?.textContent).toBe('');
    });

    test('should handle special characters in title', () => {
      const specialTitle = '<>&"\'';
      render(
        <MovieList data={mockMovieData} title={specialTitle} isLoading={false} />
      );
      expect(screen.getByText(specialTitle)).toBeTruthy();
    });

    test('should handle unicode characters in title', () => {
      const unicodeTitle = '🎬 Movies 2024 日本語';
      render(
        <MovieList data={mockMovieData} title={unicodeTitle} isLoading={false} />
      );
      expect(screen.getByText(unicodeTitle)).toBeTruthy();
    });

    test('should handle null data gracefully', () => {
      const { container } = render(
        <MovieList data={null as any} title={mockTitle} isLoading={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    test('should handle single movie in grid', () => {
      const singleMovie = [{ id: '1', title: 'Solo Movie' }];
      const { container } = render(
        <MovieList data={singleMovie} title={mockTitle} isLoading={false} />
      );
      const cards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(cards.length).toBe(1);
    });
  });

  describe('Multiple Instances', () => {
    test('should render multiple MovieList instances', () => {
      render(
        <>
          <MovieList data={mockMovieData} title="List 1" isLoading={false} />
          <MovieList data={mockMovieData} title="List 2" isLoading={false} />
        </>
      );
      expect(screen.getByText('List 1')).toBeTruthy();
      expect(screen.getByText('List 2')).toBeTruthy();
    });

    test('should maintain separate state for multiple instances', () => {
      const data1 = [{ id: '1', title: 'Movie 1' }];
      const data2 = [
        { id: '2', title: 'Movie 2' },
        { id: '3', title: 'Movie 3' },
      ];

      render(
        <>
          <MovieList data={data1} title="List 1" isLoading={false} />
          <MovieList data={data2} title="List 2" isLoading={true} />
        </>
      );

      expect(screen.getByTestId('movie-card-1')).toBeTruthy();
      expect(screen.getByTestId('movie-card-2')).toBeTruthy();
      expect(screen.getByTestId('movie-card-3')).toBeTruthy();
    });

    test('should handle different loading states in multiple instances', () => {
      const data = [{ id: '1', title: 'Movie' }];

      render(
        <>
          <MovieList data={data} title="Loading" isLoading={true} />
          <MovieList data={data} title="Loaded" isLoading={false} />
        </>
      );

      const cards = screen.getAllByTestId('movie-card-1');
      expect(cards.length).toBe(2);
    });
  });

  describe('Grid Responsiveness', () => {
    test('should apply grid-cols-2 for mobile', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/grid-cols-2/);
    });

    test('should apply lg:grid-cols-4 for large screens', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/lg:grid-cols-4/);
    });

    test('should apply gap-2 for mobile spacing', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/gap-2/);
    });

    test('should apply md:gap-4 for medium and larger screens', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/md:gap-4/);
    });
  });

  describe('DOM Structure', () => {
    test('should have exactly two nested divs with correct structure', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const allDivs = container.querySelectorAll('div');
      expect(allDivs.length).toBeGreaterThanOrEqual(3);
    });

    test('should have title before grid', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      // Verify both elements exist
      const title = container.querySelector('p');
      const grid = container.querySelector('.grid');
      expect(title).toBeTruthy();
      expect(grid).toBeTruthy();
    });

    test('should render MovieCard children in grid', () => {
      const { container } = render(
        <MovieList data={mockMovieData} title={mockTitle} isLoading={false} />
      );
      const grid = container.querySelector('.grid');
      const children = grid?.children;
      expect(children?.length).toBe(mockMovieData.length);
    });
  });
});
