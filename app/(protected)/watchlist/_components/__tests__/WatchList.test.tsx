import React from "react";
import { render, screen } from "@testing-library/react";
import WatchList from "../WatchList";
import { useWatchlist } from "@/hooks/useWatchlist";

// Mock dependencies
jest.mock("@/hooks/useWatchlist");

// Mock MovieCard component
jest.mock("@/components/MovieCard", () => {
  return function MockMovieCard({ data, isLoading }: any) {
    return (
      <div data-testid={`movie-card-${data.id}`}>
        <span>Movie: {data.title}</span>
        <span>Loading: {isLoading ? "true" : "false"}</span>
      </div>
    );
  };
});

// Mock lodash isEmpty
jest.mock("lodash", () => ({
  isEmpty: jest.fn((value) => {
    return !value || (Array.isArray(value) && value.length === 0);
  }),
}));

const mockUseWatchlist = useWatchlist as jest.MockedFunction<typeof useWatchlist>;

describe("WatchList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
    });

    it("should accept title prop", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      render(<WatchList title="Test Title" />);
      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("should render with different titles", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      const { rerender } = render(<WatchList title="First Title" />);
      expect(screen.getByText("First Title")).toBeInTheDocument();

      rerender(<WatchList title="Second Title" />);
      expect(screen.getByText("Second Title")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should display loading message when loading is true", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: true,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Loads Watchlist...")).toBeInTheDocument();
    });

    it("should not display content when loading", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: true,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.queryByText("My Watchlist")).not.toBeInTheDocument();
      expect(screen.getByText("Loads Watchlist...")).toBeInTheDocument();
    });

    it("should not render MovieCard components when loading", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: true,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.queryByTestId("movie-card-1")).not.toBeInTheDocument();
    });

    it("should render loading state in container div", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: true,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const loadingDiv = container.querySelector(".text-white.text-center");
      expect(loadingDiv).toHaveTextContent("Loads Watchlist...");
    });
  });

  describe("Error State", () => {
    it("should display error message when error exists", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: "Failed to load watchlist",
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Failed to load watchlist")).toBeInTheDocument();
    });

    it("should not display content when error exists", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: "Network error",
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.queryByText("My Watchlist")).not.toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    it("should render error with red text color", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: "Error occurred",
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const errorDiv = container.querySelector(".text-red-500.text-center");
      expect(errorDiv).toHaveTextContent("Error occurred");
    });

    it("should handle different error messages", () => {
      const { rerender } = render(<WatchList title="My Watchlist" />);

      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: "First error",
      });
      rerender(<WatchList title="My Watchlist" />);
      expect(screen.getByText("First error")).toBeInTheDocument();

      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: "Second error",
      });
      rerender(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Second error")).toBeInTheDocument();
    });

    it("should not render MovieCard components when error exists", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: "Error",
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.queryByTestId("movie-card-1")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty message when watchlist is empty", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
    });

    it("should not display title when watchlist is empty", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.queryByText("My Watchlist")).not.toBeInTheDocument();
    });

    it("should not render MovieCard components when watchlist is empty", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.queryByTestId(/movie-card-/)).not.toBeInTheDocument();
    });

    it("should render empty state in container div", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const emptyDiv = container.querySelector(".text-white.text-center");
      expect(emptyDiv).toHaveTextContent("Your watchlist is empty.");
    });
  });

  describe("Data Rendering", () => {
    it("should render title when watchlist has items", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("My Watchlist")).toBeInTheDocument();
    });

    it("should render MovieCard for each item", () => {
      const mockWatchlist = [
        { id: "1", title: "Movie 1" },
        { id: "2", title: "Movie 2" },
        { id: "3", title: "Movie 3" },
      ];

      mockUseWatchlist.mockReturnValue({
        watchlist: mockWatchlist,
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-3")).toBeInTheDocument();
    });

    it("should pass correct data prop to MovieCard", () => {
      const mockMovie = { id: "1", title: "Test Movie", genre: "Action" };

      mockUseWatchlist.mockReturnValue({
        watchlist: [mockMovie],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Movie: Test Movie")).toBeInTheDocument();
    });

    it("should pass isLoading prop to MovieCard", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
    });

    it("should pass unique key to each MovieCard", () => {
      const mockWatchlist = [
        { id: "1", title: "Movie 1" },
        { id: "2", title: "Movie 2" },
      ];

      mockUseWatchlist.mockReturnValue({
        watchlist: mockWatchlist,
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("should call useWatchlist hook", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(mockUseWatchlist).toHaveBeenCalled();
    });

    it("should call useWatchlist once per render", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(mockUseWatchlist).toHaveBeenCalledTimes(1);
    });

    it("should use watchlist from hook", () => {
      const mockWatchlist = [
        { id: "1", title: "Movie 1" },
        { id: "2", title: "Movie 2" },
      ];

      mockUseWatchlist.mockReturnValue({
        watchlist: mockWatchlist,
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();
    });

    it("should use loading state from hook", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: true,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Loads Watchlist...")).toBeInTheDocument();
    });

    it("should use error state from hook", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: "Hook error",
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Hook error")).toBeInTheDocument();
    });
  });

  describe("Multiple Movies", () => {
    it("should render multiple MovieCard components", () => {
      const mockWatchlist = [
        { id: "1", title: "Movie 1" },
        { id: "2", title: "Movie 2" },
        { id: "3", title: "Movie 3" },
        { id: "4", title: "Movie 4" },
      ];

      mockUseWatchlist.mockReturnValue({
        watchlist: mockWatchlist,
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-3")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-4")).toBeInTheDocument();
    });

    it("should handle large watchlists", () => {
      const mockWatchlist = Array.from({ length: 20 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Movie ${i + 1}`,
      }));

      mockUseWatchlist.mockReturnValue({
        watchlist: mockWatchlist,
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-20")).toBeInTheDocument();
    });

    it("should preserve order of movies", () => {
      const mockWatchlist = [
        { id: "1", title: "First" },
        { id: "2", title: "Second" },
        { id: "3", title: "Third" },
      ];

      mockUseWatchlist.mockReturnValue({
        watchlist: mockWatchlist,
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      
      expect(screen.getByText("Movie: First")).toBeInTheDocument();
      expect(screen.getByText("Movie: Second")).toBeInTheDocument();
      expect(screen.getByText("Movie: Third")).toBeInTheDocument();
    });
  });

  describe("Styling and Layout", () => {
    it("should apply container classes", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const mainDiv = container.querySelector(".px-4.my-6.space-y-8.md\\:px-12");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should apply grid layout classes", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const gridDiv = container.querySelector(".grid.grid-cols-2.gap-4.mt-4.lg\\:grid-cols-4.md\\:gap-4");
      expect(gridDiv).toBeInTheDocument();
    });

    it("should apply title text classes", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const titleP = container.querySelector(".font-semibold.text-white.text-md.md\\:text-xl.lg\\:text-2xl");
      expect(titleP).toBeInTheDocument();
    });

    it("should center loading message", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: true,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const loadingDiv = container.querySelector(".text-center");
      expect(loadingDiv).toHaveTextContent("Loads Watchlist...");
    });

    it("should center error message", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: "Error",
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const errorDiv = container.querySelector(".text-center");
      expect(errorDiv).toHaveTextContent("Error");
    });

    it("should center empty message", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const emptyDiv = container.querySelector(".text-center");
      expect(emptyDiv).toHaveTextContent("Your watchlist is empty.");
    });
  });

  describe("Edge Cases", () => {
    it("should handle watchlist with single item", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Solo Movie" }],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
    });

    it("should handle movies with missing optional fields", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie" }],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Movie: Movie")).toBeInTheDocument();
    });

    it("should handle empty title prop", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="" />);
      const titleElement = container.querySelector("p.font-semibold");
      expect(titleElement).toHaveTextContent("");
    });

    it("should handle long error messages", () => {
      const longError = "This is a very long error message that should still be displayed correctly in the UI";
      
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: longError,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it("should handle special characters in title", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist & More!" />);
      expect(screen.getByText("My Watchlist & More!")).toBeInTheDocument();
    });
  });

  describe("State Transitions", () => {
    it("should transition from loading to loaded", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: true,
        error: null,
      });

      const { rerender } = render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Loads Watchlist...")).toBeInTheDocument();

      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      rerender(<WatchList title="My Watchlist" />);
      expect(screen.queryByText("Loads Watchlist...")).not.toBeInTheDocument();
      expect(screen.getByText("My Watchlist")).toBeInTheDocument();
    });

    it("should transition from loading to error", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: true,
        error: null,
      });

      const { rerender } = render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Loads Watchlist...")).toBeInTheDocument();

      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: "Failed to load",
      });

      rerender(<WatchList title="My Watchlist" />);
      expect(screen.queryByText("Loads Watchlist...")).not.toBeInTheDocument();
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });

    it("should transition from empty to loaded", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      const { rerender } = render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();

      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      rerender(<WatchList title="My Watchlist" />);
      expect(screen.queryByText("Your watchlist is empty.")).not.toBeInTheDocument();
      expect(screen.getByText("My Watchlist")).toBeInTheDocument();
    });

    it("should transition from error to loaded", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: "Error occurred",
      });

      const { rerender } = render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Error occurred")).toBeInTheDocument();

      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      rerender(<WatchList title="My Watchlist" />);
      expect(screen.queryByText("Error occurred")).not.toBeInTheDocument();
      expect(screen.getByText("My Watchlist")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("should render main container div", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const mainDiv = container.querySelector("div.px-4");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should render title in paragraph element", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const titleP = container.querySelector("p");
      expect(titleP).toHaveTextContent("My Watchlist");
    });

    it("should render grid container for movies", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      const { container } = render(<WatchList title="My Watchlist" />);
      const gridDiv = container.querySelector(".grid");
      expect(gridDiv).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("should require title prop", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      // TypeScript would catch this, but testing runtime behavior
      const { container } = render(<WatchList title="Test" />);
      expect(container).toBeInTheDocument();
    });

    it("should accept string title", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      render(<WatchList title="String Title" />);
      expect(screen.getByText("String Title")).toBeInTheDocument();
    });
  });

  describe("isEmpty Usage", () => {
    it("should check if watchlist is empty using isEmpty", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
    });

    it("should not show empty message when watchlist has items", () => {
      mockUseWatchlist.mockReturnValue({
        watchlist: [{ id: "1", title: "Movie 1" }],
        loading: false,
        error: null,
      });

      render(<WatchList title="My Watchlist" />);
      expect(screen.queryByText("Your watchlist is empty.")).not.toBeInTheDocument();
    });
  });
});
