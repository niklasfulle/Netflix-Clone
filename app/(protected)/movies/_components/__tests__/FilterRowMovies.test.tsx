import React from "react";
import { render, screen } from "@testing-library/react";
import FilterRowMovies from "../FilterRowMovies";
import useMoviesByActor from "@/hooks/movies/useMoviesByActor";

// Mock the custom hook
jest.mock("@/hooks/movies/useMoviesByActor");

// Mock the FilterRowBase component
jest.mock("@/components/FilterRowBase", () => {
  return function MockFilterRowBase({ title, movies, isLoading }: any) {
    if (isLoading) {
      return <div data-testid="filter-row-loading">Loading {title}...</div>;
    }
    if (!movies || movies.length === 0) {
      return <div data-testid="filter-row-empty">{title} - No movies</div>;
    }
    return (
      <div data-testid="filter-row-base">
        <h2>{title}</h2>
        <div data-testid="movie-count">{movies.length} movies</div>
        {movies.map((movie: any) => (
          <div key={movie.id} data-testid={`movie-${movie.id}`}>
            {movie.title}
          </div>
        ))}
      </div>
    );
  };
});

const mockMovies = [
  {
    id: "movie-1",
    title: "Action Movie 1",
    description: "An action-packed movie",
    videoUrl: "/videos/movie1.mp4",
    thumbnailUrl: "/thumbnails/movie1.jpg",
    genre: "Action",
  },
  {
    id: "movie-2",
    title: "Action Movie 2",
    description: "Another action movie",
    videoUrl: "/videos/movie2.mp4",
    thumbnailUrl: "/thumbnails/movie2.jpg",
    genre: "Action",
  },
  {
    id: "movie-3",
    title: "Action Movie 3",
    description: "Third action movie",
    videoUrl: "/videos/movie3.mp4",
    thumbnailUrl: "/thumbnails/movie3.jpg",
    genre: "Action",
  },
];

describe("FilterRowMovies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders FilterRowBase component", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action Stars" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });

    it("renders without crashing", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container } = render(<FilterRowMovies title="Drama" />);
      expect(container).toBeDefined();
    });

    it("renders with movie data", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action Stars" />);
      expect(screen.getByText("Action Stars")).toBeInTheDocument();
      expect(screen.getByText("3 movies")).toBeInTheDocument();
    });

    it("renders all movies from data", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action Stars" />);
      expect(screen.getByText("Action Movie 1")).toBeInTheDocument();
      expect(screen.getByText("Action Movie 2")).toBeInTheDocument();
      expect(screen.getByText("Action Movie 3")).toBeInTheDocument();
    });

    it("displays the provided title", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Custom Title" />);
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("accepts title prop", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Test Title" />);
      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("passes title to hook", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action Stars" />);
      expect(useMoviesByActor).toHaveBeenCalledWith("Action Stars");
    });

    it("passes title to FilterRowBase", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Drama Stars" />);
      expect(screen.getByText("Drama Stars")).toBeInTheDocument();
    });

    it("passes movies to FilterRowBase", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("movie-count")).toHaveTextContent("3 movies");
    });

    it("passes isLoading to FilterRowBase", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });

      render(<FilterRowMovies title="Loading" />);
      expect(screen.getByTestId("filter-row-loading")).toBeInTheDocument();
    });

    it("handles title with special characters", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action & Drama" />);
      expect(screen.getByText("Action & Drama")).toBeInTheDocument();
    });

    it("handles title with unicode characters", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="电影 😀" />);
      expect(screen.getByText("电影 😀")).toBeInTheDocument();
    });

    it("handles empty title string", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("calls useMoviesByActor hook", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(useMoviesByActor).toHaveBeenCalled();
    });

    it("calls hook with correct title parameter", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Comedy Stars" />);
      expect(useMoviesByActor).toHaveBeenCalledWith("Comedy Stars");
    });

    it("calls hook only once per render", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(useMoviesByActor).toHaveBeenCalledTimes(1);
    });

    it("uses data from hook", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByText("Action Movie 1")).toBeInTheDocument();
    });

    it("handles hook returning null data", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-empty")).toBeInTheDocument();
    });

    it("handles hook returning undefined data with default empty array", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-empty")).toBeInTheDocument();
    });

    it("defaults to empty array when data is undefined", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-empty")).toBeInTheDocument();
    });

    it("uses isLoading state from hook", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-loading")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading state when isLoading is true", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });

      render(<FilterRowMovies title="Action Stars" />);
      expect(screen.getByTestId("filter-row-loading")).toBeInTheDocument();
      expect(screen.getByText("Loading Action Stars...")).toBeInTheDocument();
    });

    it("hides content during loading", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: true,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.queryByTestId("filter-row-base")).not.toBeInTheDocument();
    });

    it("shows content when loading is complete", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
      expect(screen.queryByTestId("filter-row-loading")).not.toBeInTheDocument();
    });

    it("transitions from loading to loaded state", () => {
      const { rerender } = render(<FilterRowMovies title="Action" />);

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });
      rerender(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-loading")).toBeInTheDocument();

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });
      rerender(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });

    it("shows loading with title in message", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });

      render(<FilterRowMovies title="Drama Favorites" />);
      expect(screen.getByText("Loading Drama Favorites...")).toBeInTheDocument();
    });
  });

  describe("Data Handling", () => {
    it("handles empty movie array", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-empty")).toBeInTheDocument();
    });

    it("handles single movie", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [mockMovies[0]],
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByText("1 movies")).toBeInTheDocument();
      expect(screen.getByText("Action Movie 1")).toBeInTheDocument();
    });

    it("handles multiple movies", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByText("3 movies")).toBeInTheDocument();
    });

    it("handles large number of movies", () => {
      const manyMovies = Array.from({ length: 50 }, (_, i) => ({
        id: `movie-${i}`,
        title: `Movie ${i}`,
        description: `Description ${i}`,
      }));

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: manyMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByText("50 movies")).toBeInTheDocument();
    });

    it("handles movies with minimal data", () => {
      const minimalMovies = [
        { id: "1", title: "Movie 1" },
        { id: "2", title: "Movie 2" },
      ];

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: minimalMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByText("Movie 1")).toBeInTheDocument();
      expect(screen.getByText("Movie 2")).toBeInTheDocument();
    });

    it("handles movies with special characters in title", () => {
      const specialMovies = [
        { id: "1", title: "Movie & Show: The \"Best\"" },
      ];

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: specialMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByText(/Movie & Show/)).toBeInTheDocument();
    });

    it("handles movies with unicode characters", () => {
      const unicodeMovies = [
        { id: "1", title: "电影 😀" },
      ];

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: unicodeMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByText("电影 😀")).toBeInTheDocument();
    });

    it("handles null data with default fallback", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-empty")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid re-renders", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      const { rerender } = render(<FilterRowMovies title="Action" />);
      rerender(<FilterRowMovies title="Action" />);
      rerender(<FilterRowMovies title="Action" />);
      rerender(<FilterRowMovies title="Action" />);

      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });

    it("handles title prop changes", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      const { rerender } = render(<FilterRowMovies title="Action" />);
      expect(screen.getByText("Action")).toBeInTheDocument();

      rerender(<FilterRowMovies title="Drama" />);
      expect(screen.getByText("Drama")).toBeInTheDocument();
    });

    it("handles data changes", () => {
      const { rerender } = render(<FilterRowMovies title="Action" />);

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [mockMovies[0]],
        isLoading: false,
      });
      rerender(<FilterRowMovies title="Action" />);
      expect(screen.getByText("1 movies")).toBeInTheDocument();

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });
      rerender(<FilterRowMovies title="Action" />);
      expect(screen.getByText("3 movies")).toBeInTheDocument();
    });

    it("handles switching between loading states", () => {
      const { rerender } = render(<FilterRowMovies title="Action" />);

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });
      rerender(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-loading")).toBeInTheDocument();

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });
      rerender(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-empty")).toBeInTheDocument();
    });

    it("maintains component stability across renders", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      const { container, rerender } = render(<FilterRowMovies title="Action" />);
      const firstHtml = container.innerHTML;

      rerender(<FilterRowMovies title="Action" />);
      const secondHtml = container.innerHTML;

      expect(firstHtml).toBe(secondHtml);
    });

    it("handles very long title", () => {
      const longTitle = "A".repeat(200);
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("handles movies with duplicate ids gracefully", () => {
      const duplicateMovies = [
        { id: "1", title: "Movie 1" },
        { id: "1", title: "Movie 1 Duplicate" },
      ];

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: duplicateMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("returns a single component", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      const { container } = render(<FilterRowMovies title="Action" />);
      expect(container.firstChild).toBeDefined();
    });

    it("uses FilterRowBase as child component", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });

    it("does not render multiple FilterRowBase components", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      const filterRows = screen.queryAllByTestId("filter-row-base");
      expect(filterRows).toHaveLength(1);
    });

    it("component is a functional component", () => {
      expect(typeof FilterRowMovies).toBe("function");
    });

    it("component accepts React.FC props", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      expect(() => render(<FilterRowMovies title="Action" />)).not.toThrow();
    });
  });

  describe("Mock Verification", () => {
    it("hook mock is properly configured", () => {
      expect(useMoviesByActor).toBeDefined();
      expect(jest.isMockFunction(useMoviesByActor)).toBe(true);
    });

    it("can reset hook mock", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      jest.clearAllMocks();

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });

      render(<FilterRowMovies title="Drama" />);
      expect(useMoviesByActor).toHaveBeenCalled();
    });

    it("mock data structure is valid", () => {
      expect(mockMovies).toHaveLength(3);
      expect(mockMovies[0].id).toBeDefined();
      expect(mockMovies[0].title).toBeDefined();
    });

    it("can override mock return values", () => {
      const customMovies = [{ id: "custom", title: "Custom Movie" }];

      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: customMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Action" />);
      expect(screen.getByText("Custom Movie")).toBeInTheDocument();
    });

    it("hook is called with parameter from props", () => {
      (useMoviesByActor as jest.Mock).mockReturnValue({
        data: mockMovies,
        isLoading: false,
      });

      render(<FilterRowMovies title="Test Actor" />);
      expect(useMoviesByActor).toHaveBeenCalledWith("Test Actor");
      expect(useMoviesByActor).not.toHaveBeenCalledWith("Wrong Actor");
    });
  });
});
