import React from "react";
import { render, screen } from "@testing-library/react";
import SearchList from "../SearchList";

// Mock lodash
jest.mock("lodash", () => ({
  isEmpty: (arr: any) => !arr || arr.length === 0,
}));

// Mock MovieCard
jest.mock("@/components/MovieCard", () => {
  return function MockMovieCard({ data, isLoading }: any) {
    return (
      <div data-testid={`movie-card-${data.id}`}>
        <span>Movie: {data.title}</span>
        <span>Loading: {isLoading.toString()}</span>
      </div>
    );
  };
});

describe("SearchList", () => {
  const mockMovies = [
    {
      id: "1",
      title: "Movie 1",
      description: "Description 1",
      videoUrl: "/videos/1.mp4",
      thumbnailUrl: "/images/1.jpg",
      genre: "Action",
      duration: "120 min",
    },
    {
      id: "2",
      title: "Movie 2",
      description: "Description 2",
      videoUrl: "/videos/2.mp4",
      thumbnailUrl: "/images/2.jpg",
      genre: "Drama",
      duration: "90 min",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );
      expect(container).toBeTruthy();
    });

    it("renders the title", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );
      expect(screen.getByText("Search Results for")).toBeInTheDocument();
    });

    it("renders the search item", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );
      expect(screen.getByText("action")).toBeInTheDocument();
    });
  });

  describe("Empty Data Handling", () => {
    it("returns null when data is empty", () => {
      const { container } = render(
        <SearchList
          data={[]}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("does not render title when data is empty", () => {
      render(
        <SearchList
          data={[]}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      expect(screen.queryByText("Search Results for")).not.toBeInTheDocument();
    });

    it("does not render MovieCards when data is empty", () => {
      const { container } = render(
        <SearchList
          data={[]}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const movieCards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(movieCards).toHaveLength(0);
    });
  });

  describe("Title Display", () => {
    it("displays title with correct styling", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const titleElement = screen.getByText("Search Results for");
      expect(titleElement).toHaveClass("font-semibold");
      expect(titleElement).toHaveClass("text-white");
    });

    it("displays searchItem in italic font", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action movies"
        />
      );

      const searchItemElement = screen.getByText("action movies");
      expect(searchItemElement).toHaveClass("italic");
      expect(searchItemElement).toHaveClass("font-thin");
    });

    it("renders title and searchItem together", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="thriller"
        />
      );

      expect(screen.getByText("Search Results for")).toBeInTheDocument();
      expect(screen.getByText("thriller")).toBeInTheDocument();
    });

    it("handles long search items", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Results"
          isLoading={false}
          searchItem="a very long search query that spans multiple words"
        />
      );

      expect(
        screen.getByText("a very long search query that spans multiple words")
      ).toBeInTheDocument();
    });
  });

  describe("MovieCard Rendering", () => {
    it("renders a MovieCard for each movie in data", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();
    });

    it("passes correct data prop to MovieCard", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      expect(screen.getByText("Movie: Movie 1")).toBeInTheDocument();
      expect(screen.getByText("Movie: Movie 2")).toBeInTheDocument();
    });

    it("passes isLoading prop to MovieCard", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={true}
          searchItem="action"
        />
      );

      const loadingElements = screen.getAllByText("Loading: true");
      expect(loadingElements).toHaveLength(2);
    });

    it("passes isLoading false to MovieCard when not loading", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const loadingElements = screen.getAllByText("Loading: false");
      expect(loadingElements).toHaveLength(2);
    });

    it("uses movie id as key for MovieCard", () => {
      const { container } = render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const movieCards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(movieCards).toHaveLength(2);
    });
  });

  describe("Grid Layout", () => {
    it("renders grid with correct classes", () => {
      const { container } = render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-4");
    });

    it("has proper spacing classes", () => {
      const { container } = render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("gap-4");
      expect(grid).toHaveClass("mt-4");
    });

    it("has container with proper padding", () => {
      const { container } = render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const outerDiv = container.querySelector(".px-4");
      expect(outerDiv).toHaveClass("my-6");
      expect(outerDiv).toHaveClass("md:px-12");
    });
  });

  describe("Multiple Movies", () => {
    it("renders single movie correctly", () => {
      const singleMovie = [mockMovies[0]];

      render(
        <SearchList
          data={singleMovie}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.queryByTestId("movie-card-2")).not.toBeInTheDocument();
    });

    it("renders many movies correctly", () => {
      const manyMovies = [
        ...mockMovies,
        { ...mockMovies[0], id: "3", title: "Movie 3" },
        { ...mockMovies[0], id: "4", title: "Movie 4" },
        { ...mockMovies[0], id: "5", title: "Movie 5" },
      ];

      render(
        <SearchList
          data={manyMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-3")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-4")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-5")).toBeInTheDocument();
    });

    it("handles movies with different properties", () => {
      const diverseMovies = [
        {
          id: "1",
          title: "Short Title",
          genre: "Action",
        },
        {
          id: "2",
          title: "A Very Long Movie Title That Could Overflow",
          genre: "Drama",
        },
      ];

      render(
        <SearchList
          data={diverseMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="movies"
        />
      );

      expect(screen.getByText("Movie: Short Title")).toBeInTheDocument();
      expect(
        screen.getByText("Movie: A Very Long Movie Title That Could Overflow")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string searchItem", () => {
      render(
        <SearchList
          data={mockMovies}
          title="All Results"
          isLoading={false}
          searchItem=""
        />
      );

      expect(screen.getByText("All Results")).toBeInTheDocument();
    });

    it("handles special characters in searchItem", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action & drama"
        />
      );

      expect(screen.getByText("action & drama")).toBeInTheDocument();
    });

    it("handles empty title", () => {
      render(
        <SearchList
          data={mockMovies}
          title=""
          isLoading={false}
          searchItem="action"
        />
      );

      expect(screen.getByText("action")).toBeInTheDocument();
    });

    it("handles movies with missing optional properties", () => {
      const minimalMovies = [
        { id: "1", title: "Movie 1" },
        { id: "2", title: "Movie 2" },
      ];

      render(
        <SearchList
          data={minimalMovies}
          title="Results"
          isLoading={false}
          searchItem="test"
        />
      );

      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("renders correctly when loading", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={true}
          searchItem="action"
        />
      );

      expect(screen.getByText("Search Results for")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      const loadingElements = screen.getAllByText("Loading: true");
      expect(loadingElements).toHaveLength(2);
    });

    it("renders correctly when not loading", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      expect(screen.getByText("Search Results for")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      const loadingElements = screen.getAllByText("Loading: false");
      expect(loadingElements).toHaveLength(2);
    });
  });

  describe("Responsive Design", () => {
    it("has responsive text classes", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const titleElement = screen.getByText("Search Results for");
      expect(titleElement).toHaveClass("text-md");
      expect(titleElement).toHaveClass("md:text-xl");
      expect(titleElement).toHaveClass("lg:text-2xl");
    });

    it("has responsive padding classes", () => {
      const { container } = render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const outerDiv = container.querySelector(".px-4");
      expect(outerDiv).toHaveClass("px-4");
      expect(outerDiv).toHaveClass("md:px-12");
    });

    it("has responsive grid columns", () => {
      const { container } = render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-4");
    });
  });

  describe("Integration", () => {
    it("renders complete search results interface", () => {
      render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action movies"
        />
      );

      // Title and search item
      expect(screen.getByText("Search Results for")).toBeInTheDocument();
      expect(screen.getByText("action movies")).toBeInTheDocument();

      // Movie cards
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();

      // Movie data
      expect(screen.getByText("Movie: Movie 1")).toBeInTheDocument();
      expect(screen.getByText("Movie: Movie 2")).toBeInTheDocument();
    });

    it("handles complete flow with empty data", () => {
      const { container } = render(
        <SearchList
          data={[]}
          title="Search Results for"
          isLoading={false}
          searchItem="nonexistent"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders all elements with correct hierarchy", () => {
      const { container } = render(
        <SearchList
          data={mockMovies}
          title="Search Results for"
          isLoading={false}
          searchItem="action"
        />
      );

      // Outer container
      const outerDiv = container.querySelector(".px-4.my-6");
      expect(outerDiv).toBeInTheDocument();

      // Inner div
      const innerDiv = outerDiv?.querySelector("div");
      expect(innerDiv).toBeInTheDocument();

      // Title paragraph
      const titleParagraph = innerDiv?.querySelector("p");
      expect(titleParagraph).toBeInTheDocument();

      // Grid
      const grid = innerDiv?.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });
  });
});
