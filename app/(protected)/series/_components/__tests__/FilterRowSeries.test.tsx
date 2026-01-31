import React from "react";
import { render, screen } from "@testing-library/react";
import FilterRowSeries from "../FilterRowSeries";
import useSeriesByActor from "@/hooks/series/useSeriesByActor";

// Mock the hook
jest.mock("@/hooks/series/useSeriesByActor");

// Mock FilterRowBase component
jest.mock("@/components/FilterRowBase", () => {
  return function MockFilterRowBase({ title, movies, isLoading }: any) {
    return (
      <div data-testid="filter-row-base">
        <h2>{title}</h2>
        <span>Loading: {String(isLoading)}</span>
        <span>Count: {movies?.length || 0}</span>
        {movies?.map((movie: any) => (
          <div key={movie.id} data-testid={`movie-${movie.id}`}>
            {movie.title}
          </div>
        ))}
      </div>
    );
  };
});

const mockUseSeriesByActor = useSeriesByActor as jest.MockedFunction<
  typeof useSeriesByActor
>;

describe("FilterRowSeries", () => {
  const mockSeriesData = [
    {
      id: "series-1",
      title: "Drama Series 1",
      description: "A dramatic series",
      genre: "Drama",
      duration: "45 min",
    },
    {
      id: "series-2",
      title: "Drama Series 2",
      description: "Another dramatic series",
      genre: "Drama",
      duration: "50 min",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSeriesByActor.mockReturnValue({
      data: mockSeriesData,
      isLoading: false,
    } as any);
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });

    it("renders FilterRowBase component", () => {
      render(<FilterRowSeries title="Action" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });

    it("displays the title", () => {
      render(<FilterRowSeries title="Comedy" />);
      expect(screen.getByText("Comedy")).toBeInTheDocument();
    });
  });

  describe("Props Passing", () => {
    it("passes title prop to FilterRowBase", () => {
      render(<FilterRowSeries title="Thriller" />);
      expect(screen.getByText("Thriller")).toBeInTheDocument();
    });

    it("passes movies data to FilterRowBase", () => {
      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 2")).toBeInTheDocument();
    });

    it("passes isLoading to FilterRowBase", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("passes all props correctly", () => {
      render(<FilterRowSeries title="Action" />);
      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
      expect(screen.getByText("Count: 2")).toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("calls useSeriesByActor with title", () => {
      render(<FilterRowSeries title="Drama" />);
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Drama");
    });

    it("calls useSeriesByActor exactly once", () => {
      render(<FilterRowSeries title="Comedy" />);
      expect(mockUseSeriesByActor).toHaveBeenCalledTimes(1);
    });

    it("uses data from useSeriesByActor hook", () => {
      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Drama Series 1")).toBeInTheDocument();
      expect(screen.getByText("Drama Series 2")).toBeInTheDocument();
    });

    it("handles hook updates", () => {
      const { rerender } = render(<FilterRowSeries title="Drama" />);
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Drama");

      rerender(<FilterRowSeries title="Comedy" />);
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Comedy");
    });
  });

  describe("Loading States", () => {
    it("renders with loading true", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("renders with loading false", () => {
      render(<FilterRowSeries title="Action" />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
    });

    it("handles loading to loaded transition", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);

      const { rerender } = render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();

      mockUseSeriesByActor.mockReturnValue({
        data: mockSeriesData,
        isLoading: false,
      } as any);

      rerender(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
    });
  });

  describe("Data States", () => {
    it("handles undefined data", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 0")).toBeInTheDocument();
    });

    it("handles null data", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: null,
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 0")).toBeInTheDocument();
    });

    it("handles empty array", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 0")).toBeInTheDocument();
    });

    it("renders with single series", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: [mockSeriesData[0]],
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 1")).toBeInTheDocument();
      expect(screen.getByText("Drama Series 1")).toBeInTheDocument();
    });

    it("renders with multiple series", () => {
      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 2")).toBeInTheDocument();
    });

    it("renders with many series", () => {
      const manySeries = Array.from({ length: 10 }, (_, i) => ({
        id: `series-${i}`,
        title: `Series ${i}`,
        genre: "Drama",
      }));

      mockUseSeriesByActor.mockReturnValue({
        data: manySeries,
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 10")).toBeInTheDocument();
    });
  });

  describe("Different Titles", () => {
    it("renders with Drama title", () => {
      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Drama")).toBeInTheDocument();
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Drama");
    });

    it("renders with Comedy title", () => {
      render(<FilterRowSeries title="Comedy" />);
      expect(screen.getByText("Comedy")).toBeInTheDocument();
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Comedy");
    });

    it("renders with Action title", () => {
      render(<FilterRowSeries title="Action" />);
      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Action");
    });

    it("renders with Thriller title", () => {
      render(<FilterRowSeries title="Thriller" />);
      expect(screen.getByText("Thriller")).toBeInTheDocument();
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Thriller");
    });

    it("renders with Sci-Fi title", () => {
      render(<FilterRowSeries title="Sci-Fi" />);
      expect(screen.getByText("Sci-Fi")).toBeInTheDocument();
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Sci-Fi");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string title", () => {
      render(<FilterRowSeries title="" />);
      expect(mockUseSeriesByActor).toHaveBeenCalledWith("");
    });

    it("handles very long title", () => {
      const longTitle = "A".repeat(1000);
      render(<FilterRowSeries title={longTitle} />);
      expect(mockUseSeriesByActor).toHaveBeenCalledWith(longTitle);
    });

    it("handles special characters in title", () => {
      const specialTitle = "Drama & Comedy!@#$%";
      render(<FilterRowSeries title={specialTitle} />);
      expect(mockUseSeriesByActor).toHaveBeenCalledWith(specialTitle);
    });

    it("handles title with spaces", () => {
      render(<FilterRowSeries title="Historical Drama" />);
      expect(screen.getByText("Historical Drama")).toBeInTheDocument();
    });

    it("handles series with missing properties", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: [
          { id: "1", title: "Series 1" },
          { id: "2" } as any,
        ],
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByTestId("movie-1")).toBeInTheDocument();
      expect(screen.getByTestId("movie-2")).toBeInTheDocument();
    });
  });

  describe("Multiple Renders", () => {
    it("calls hook on each render", () => {
      const { rerender } = render(<FilterRowSeries title="Drama" />);
      expect(mockUseSeriesByActor).toHaveBeenCalledTimes(1);

      rerender(<FilterRowSeries title="Drama" />);
      expect(mockUseSeriesByActor).toHaveBeenCalledTimes(2);
    });

    it("updates when title changes", () => {
      const { rerender } = render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Drama")).toBeInTheDocument();

      rerender(<FilterRowSeries title="Comedy" />);
      expect(screen.getByText("Comedy")).toBeInTheDocument();
    });

    it("updates when data changes", () => {
      const { rerender } = render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 2")).toBeInTheDocument();

      mockUseSeriesByActor.mockReturnValue({
        data: [mockSeriesData[0]],
        isLoading: false,
      } as any);

      rerender(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 1")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders complete component with all data", () => {
      render(<FilterRowSeries title="Drama" />);

      expect(mockUseSeriesByActor).toHaveBeenCalledWith("Drama");
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
      expect(screen.getByText("Drama")).toBeInTheDocument();
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
      expect(screen.getByText("Count: 2")).toBeInTheDocument();
    });

    it("handles complete loading workflow", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { rerender } = render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
      expect(screen.getByText("Count: 0")).toBeInTheDocument();

      mockUseSeriesByActor.mockReturnValue({
        data: mockSeriesData,
        isLoading: false,
      } as any);

      rerender(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
      expect(screen.getByText("Count: 2")).toBeInTheDocument();
    });

    it("maintains component stability across renders", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: mockSeriesData,
        error: null,
        isLoading: false,
      });

      const { container, rerender } = render(<FilterRowSeries title="Drama" />);
      const firstHtml = container.innerHTML;

      rerender(<FilterRowSeries title="Drama" />);
      const secondHtml = container.innerHTML;

      expect(firstHtml).toBe(secondHtml);
    });
  });

  describe("Hook Return Values", () => {
    it("handles hook returning only data", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: mockSeriesData,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
    });

    it("handles hook returning only isLoading", () => {
      mockUseSeriesByActor.mockReturnValue({
        isLoading: true,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("defaults to empty array when data is undefined", () => {
      mockUseSeriesByActor.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 0")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("returns FilterRowBase component", () => {
      const { container } = render(<FilterRowSeries title="Drama" />);
      expect(screen.getByTestId("filter-row-base")).toBeInTheDocument();
      expect(container.querySelector('[data-testid="filter-row-base"]')).toBeTruthy();
    });
  });

  describe("Actor/Genre Variations", () => {
    it("handles different genres", () => {
      const genres = ["Drama", "Comedy", "Action", "Thriller", "Sci-Fi"];

      genres.forEach((genre) => {
        const { unmount } = render(<FilterRowSeries title={genre} />);
        expect(screen.getByText(genre)).toBeInTheDocument();
        expect(mockUseSeriesByActor).toHaveBeenCalledWith(genre);
        unmount();
      });
    });

    it("handles different actor names", () => {
      const actors = ["Tom Hanks", "Meryl Streep", "Denzel Washington"];

      actors.forEach((actor) => {
        const { unmount } = render(<FilterRowSeries title={actor} />);
        expect(screen.getByText(actor)).toBeInTheDocument();
        expect(mockUseSeriesByActor).toHaveBeenCalledWith(actor);
        unmount();
      });
    });

    it("handles numeric titles", () => {
      render(<FilterRowSeries title="2024" />);
      expect(screen.getByText("2024")).toBeInTheDocument();
    });
  });

  describe("Series Data Variations", () => {
    it("handles series with different durations", () => {
      const seriesWithDurations = [
        { id: "1", title: "Series 1", duration: "30 min" },
        { id: "2", title: "Series 2", duration: "45 min" },
        { id: "3", title: "Series 3", duration: "60 min" },
      ];

      mockUseSeriesByActor.mockReturnValue({
        data: seriesWithDurations,
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 3")).toBeInTheDocument();
    });

    it("handles series with complete metadata", () => {
      const completeSeries = [
        {
          id: "series-1",
          title: "Complete Series",
          description: "Full description",
          genre: "Drama",
          duration: "45 min",
          thumbnailUrl: "/thumb.jpg",
          videoUrl: "/video.mp4",
        },
      ];

      mockUseSeriesByActor.mockReturnValue({
        data: completeSeries,
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Complete Series")).toBeInTheDocument();
    });

    it("handles mixed series data quality", () => {
      const mixedSeries = [
        { id: "1", title: "Complete Series", genre: "Drama", duration: "45 min" },
        { id: "2", title: "Minimal Series" },
        { id: "3", title: "Another Series", description: "Has description" },
      ];

      mockUseSeriesByActor.mockReturnValue({
        data: mixedSeries,
        isLoading: false,
      } as any);

      render(<FilterRowSeries title="Drama" />);
      expect(screen.getByText("Count: 3")).toBeInTheDocument();
    });
  });
});
