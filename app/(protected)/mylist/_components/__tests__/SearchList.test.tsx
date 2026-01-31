import React from "react";
import { render, screen } from "@testing-library/react";
import SearchList from "../SearchList";

// Mock MovieCard component
jest.mock("@/components/MovieCard", () => {
  return function MockMovieCard({ data, isLoading }: any) {
    if (isLoading) {
      return <div data-testid={`movie-card-loading-${data.id}`}>Loading...</div>;
    }
    return (
      <div data-testid={`movie-card-${data.id}`}>
        <h3>{data.title}</h3>
      </div>
    );
  };
});

const mockMovies = [
  {
    id: "movie-1",
    title: "Movie 1",
    description: "Description 1",
    videoUrl: "/videos/1.mp4",
    thumbnailUrl: "/thumbnails/1.jpg",
  },
  {
    id: "movie-2",
    title: "Movie 2",
    description: "Description 2",
    videoUrl: "/videos/2.mp4",
    thumbnailUrl: "/thumbnails/2.jpg",
  },
  {
    id: "movie-3",
    title: "Movie 3",
    description: "Description 3",
    videoUrl: "/videos/3.mp4",
    thumbnailUrl: "/thumbnails/3.jpg",
  },
];

describe("SearchList", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Search Results" isLoading={false} />
      );
      expect(container).toBeDefined();
    });

    it("renders with movie data", () => {
      render(<SearchList data={mockMovies} title="Search Results" isLoading={false} />);
      expect(screen.getByText("Search Results")).toBeInTheDocument();
    });

    it("renders all movie cards", () => {
      render(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-movie-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-movie-2")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-movie-3")).toBeInTheDocument();
    });

    it("displays the title", () => {
      render(<SearchList data={mockMovies} title="My Results" isLoading={false} />);
      expect(screen.getByText("My Results")).toBeInTheDocument();
    });

    it("renders correct number of movie cards", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const movieCards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(movieCards).toHaveLength(3);
    });
  });

  describe("Empty State", () => {
    it("returns null when data is empty array", () => {
      const { container } = render(
        <SearchList data={[]} title="Results" isLoading={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("does not render title when data is empty", () => {
      render(<SearchList data={[]} title="Results" isLoading={false} />);
      expect(screen.queryByText("Results")).not.toBeInTheDocument();
    });

    it("does not render any movie cards when data is empty", () => {
      const { container } = render(
        <SearchList data={[]} title="Results" isLoading={false} />
      );
      const movieCards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(movieCards).toHaveLength(0);
    });

    it("returns null when data is null", () => {
      const { container } = render(
        <SearchList data={null as any} title="Results" isLoading={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null when data is undefined", () => {
      const { container } = render(
        <SearchList data={undefined as any} title="Results" isLoading={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Props Handling", () => {
    it("passes data to MovieCard", () => {
      render(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      expect(screen.getByText("Movie 1")).toBeInTheDocument();
      expect(screen.getByText("Movie 2")).toBeInTheDocument();
      expect(screen.getByText("Movie 3")).toBeInTheDocument();
    });

    it("passes isLoading prop to MovieCard", () => {
      render(<SearchList data={mockMovies} title="Results" isLoading={true} />);
      expect(screen.getByTestId("movie-card-loading-movie-1")).toBeInTheDocument();
    });

    it("renders different titles", () => {
      const { rerender } = render(
        <SearchList data={mockMovies} title="First Title" isLoading={false} />
      );
      expect(screen.getByText("First Title")).toBeInTheDocument();

      rerender(<SearchList data={mockMovies} title="Second Title" isLoading={false} />);
      expect(screen.getByText("Second Title")).toBeInTheDocument();
    });

    it("handles title with special characters", () => {
      render(
        <SearchList data={mockMovies} title="Search & Filter Results" isLoading={false} />
      );
      expect(screen.getByText("Search & Filter Results")).toBeInTheDocument();
    });

    it("handles title with unicode characters", () => {
      render(<SearchList data={mockMovies} title="搜索结果 😀" isLoading={false} />);
      expect(screen.getByText("搜索结果 😀")).toBeInTheDocument();
    });

    it("handles empty title string", () => {
      render(<SearchList data={mockMovies} title="" isLoading={false} />);
      // Component should still render movie cards even with empty title
      expect(screen.getByTestId("movie-card-movie-1")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("passes loading state to all MovieCards", () => {
      render(<SearchList data={mockMovies} title="Results" isLoading={true} />);
      expect(screen.getByTestId("movie-card-loading-movie-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-loading-movie-2")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-loading-movie-3")).toBeInTheDocument();
    });

    it("shows loaded state when isLoading is false", () => {
      render(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-movie-1")).toBeInTheDocument();
      expect(screen.queryByTestId("movie-card-loading-movie-1")).not.toBeInTheDocument();
    });

    it("transitions from loading to loaded", () => {
      const { rerender } = render(
        <SearchList data={mockMovies} title="Results" isLoading={true} />
      );
      expect(screen.getByTestId("movie-card-loading-movie-1")).toBeInTheDocument();

      rerender(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-movie-1")).toBeInTheDocument();
      expect(screen.queryByTestId("movie-card-loading-movie-1")).not.toBeInTheDocument();
    });
  });

  describe("Movie Cards", () => {
    it("uses movie id as key", () => {
      render(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-movie-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-movie-2")).toBeInTheDocument();
    });

    it("renders single movie", () => {
      render(<SearchList data={[mockMovies[0]]} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-movie-1")).toBeInTheDocument();
      expect(screen.queryByTestId("movie-card-movie-2")).not.toBeInTheDocument();
    });

    it("renders multiple movies in correct order", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const cards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(cards[0]).toHaveAttribute("data-testid", "movie-card-movie-1");
      expect(cards[1]).toHaveAttribute("data-testid", "movie-card-movie-2");
      expect(cards[2]).toHaveAttribute("data-testid", "movie-card-movie-3");
    });

    it("renders large number of movies", () => {
      const manyMovies = Array.from({ length: 50 }, (_, i) => ({
        id: `movie-${i}`,
        title: `Movie ${i}`,
      }));

      const { container } = render(
        <SearchList data={manyMovies} title="Results" isLoading={false} />
      );
      const cards = container.querySelectorAll('[data-testid^="movie-card-"]');
      expect(cards).toHaveLength(50);
    });

    it("handles movies with minimal data", () => {
      const minimalMovies = [
        { id: "1", title: "Movie 1" },
        { id: "2", title: "Movie 2" },
      ];

      render(<SearchList data={minimalMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-2")).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("applies grid layout classes", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("grid-cols-2");
    });

    it("applies responsive classes", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("lg:grid-cols-4");
    });

    it("applies spacing classes", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const wrapper = container.querySelector(".space-y-8");
      expect(wrapper).toBeInTheDocument();
    });

    it("applies padding classes", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const wrapper = container.querySelector(".px-4");
      expect(wrapper).toBeInTheDocument();
    });

    it("title has correct text styling", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const title = container.querySelector(".text-white");
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass("font-semibold");
    });
  });

  describe("Data Variations", () => {
    it("handles movies with all properties", () => {
      const completeMovies = [
        {
          id: "1",
          title: "Complete Movie",
          description: "Full description",
          videoUrl: "/video.mp4",
          thumbnailUrl: "/thumb.jpg",
          genre: "Action",
          duration: "2:00:00",
        },
      ];

      render(<SearchList data={completeMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
    });

    it("handles movies with special characters in title", () => {
      const specialMovies = [
        { id: "1", title: "Movie & Show: The \"Best\"" },
      ];

      render(<SearchList data={specialMovies} title="Results" isLoading={false} />);
      expect(screen.getByText(/Movie & Show/)).toBeInTheDocument();
    });

    it("handles movies with unicode characters", () => {
      const unicodeMovies = [
        { id: "1", title: "电影 😀" },
      ];

      render(<SearchList data={unicodeMovies} title="Results" isLoading={false} />);
      expect(screen.getByText("电影 😀")).toBeInTheDocument();
    });

    it("handles movies with long titles", () => {
      const longTitleMovies = [
        { id: "1", title: "A".repeat(200) },
      ];

      render(<SearchList data={longTitleMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
    });

    it("handles movies with numeric ids", () => {
      const numericIdMovies = [
        { id: 123 as any, title: "Movie" },
      ];

      render(<SearchList data={numericIdMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-123")).toBeInTheDocument();
    });

    it("handles movies with duplicate ids", () => {
      const duplicateMovies = [
        { id: "1", title: "Movie 1" },
        { id: "1", title: "Movie 1 Duplicate" },
      ];

      const { container } = render(
        <SearchList data={duplicateMovies} title="Results" isLoading={false} />
      );
      const cards = container.querySelectorAll('[data-testid="movie-card-1"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid re-renders", () => {
      const { rerender } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      rerender(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      rerender(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      rerender(<SearchList data={mockMovies} title="Results" isLoading={false} />);

      expect(screen.getByText("Results")).toBeInTheDocument();
    });

    it("handles data changes", () => {
      const { rerender } = render(
        <SearchList data={[mockMovies[0]]} title="Results" isLoading={false} />
      );
      expect(screen.getByTestId("movie-card-movie-1")).toBeInTheDocument();

      rerender(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-movie-2")).toBeInTheDocument();
      expect(screen.getByTestId("movie-card-movie-3")).toBeInTheDocument();
    });

    it("handles switching from data to empty", () => {
      const { rerender, container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      expect(screen.getByText("Results")).toBeInTheDocument();

      rerender(<SearchList data={[]} title="Results" isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });

    it("handles switching from empty to data", () => {
      const { rerender, container } = render(
        <SearchList data={[]} title="Results" isLoading={false} />
      );
      expect(container.firstChild).toBeNull();

      rerender(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      expect(screen.getByText("Results")).toBeInTheDocument();
    });

    it("maintains component stability across renders", () => {
      const { container, rerender } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const firstHtml = container.innerHTML;

      rerender(<SearchList data={mockMovies} title="Results" isLoading={false} />);
      const secondHtml = container.innerHTML;

      expect(firstHtml).toBe(secondHtml);
    });

    it("handles objects with extra properties", () => {
      const extraPropsMovies = [
        {
          id: "1",
          title: "Movie",
          extraProp: "extra",
          anotherProp: 123,
        },
      ];

      render(<SearchList data={extraPropsMovies} title="Results" isLoading={false} />);
      expect(screen.getByTestId("movie-card-1")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders correct wrapper structure", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const wrapper = container.querySelector(".px-4.my-6.space-y-8");
      expect(wrapper).toBeInTheDocument();
    });

    it("renders title in paragraph element", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const title = container.querySelector("p");
      expect(title).toHaveTextContent("Results");
    });

    it("renders grid container", () => {
      const { container } = render(
        <SearchList data={mockMovies} title="Results" isLoading={false} />
      );
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });

    it("component is a functional component", () => {
      expect(typeof SearchList).toBe("function");
    });

    it("accepts React.FC props", () => {
      expect(() =>
        render(<SearchList data={mockMovies} title="Results" isLoading={false} />)
      ).not.toThrow();
    });
  });
});
