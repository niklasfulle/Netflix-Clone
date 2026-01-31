import React from "react";
import { render, screen } from "@testing-library/react";
import BillboardMovie from "../BillboardMovie";
import useBillboradMovie from "@/hooks/movies/useBillboradMovie";

// Mock the custom hook
jest.mock("@/hooks/movies/useBillboradMovie");

// Mock the BillboardBase component
jest.mock("@/components/BillboardBase", () => {
  return function MockBillboardBase({ data, isLoading }: any) {
    if (isLoading) {
      return <div data-testid="billboard-loading">Loading...</div>;
    }
    if (!data) {
      return <div data-testid="billboard-no-data">No data</div>;
    }
    return (
      <div data-testid="billboard-base">
        <h1>{data.title}</h1>
        <p>{data.description}</p>
      </div>
    );
  };
});

const mockMovieData = {
  id: "movie-1",
  title: "Featured Movie",
  description: "An amazing featured movie description",
  videoUrl: "/videos/featured.mp4",
  thumbnailUrl: "/thumbnails/featured.jpg",
  genre: "Action",
  duration: "2:15:00",
};

describe("BillboardMovie", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders BillboardBase component", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });

    it("renders without crashing", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
      });

      const { container } = render(<BillboardMovie />);
      expect(container).toBeDefined();
    });

    it("renders correctly with movie data", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByText("Featured Movie")).toBeInTheDocument();
      expect(screen.getByText("An amazing featured movie description")).toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("calls useBillboradMovie hook", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(useBillboradMovie).toHaveBeenCalled();
    });

    it("calls hook only once per render", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(useBillboradMovie).toHaveBeenCalledTimes(1);
    });

    it("uses data from hook", () => {
      const customData = {
        ...mockMovieData,
        title: "Custom Title",
      };

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: customData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("handles hook returning null data", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-no-data")).toBeInTheDocument();
    });

    it("handles hook returning undefined data", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-no-data")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading state when isLoading is true", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-loading")).toBeInTheDocument();
    });

    it("hides content during loading", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: true,
      });

      render(<BillboardMovie />);
      expect(screen.queryByTestId("billboard-base")).not.toBeInTheDocument();
    });

    it("shows content when loading is complete", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
      expect(screen.queryByTestId("billboard-loading")).not.toBeInTheDocument();
    });

    it("transitions from loading to loaded state", () => {
      const { rerender } = render(<BillboardMovie />);
      
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });
      rerender(<BillboardMovie />);
      expect(screen.getByTestId("billboard-loading")).toBeInTheDocument();

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });
      rerender(<BillboardMovie />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });
  });

  describe("Props Passing", () => {
    it("passes data prop to BillboardBase", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByText(mockMovieData.title)).toBeInTheDocument();
    });

    it("passes isLoading prop to BillboardBase", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-loading")).toBeInTheDocument();
    });

    it("passes correct props when data is available", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
      expect(screen.queryByTestId("billboard-loading")).not.toBeInTheDocument();
    });

    it("passes correct props when loading", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-loading")).toBeInTheDocument();
    });
  });

  describe("Data Handling", () => {
    it("handles complete movie data", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByText(mockMovieData.title)).toBeInTheDocument();
      expect(screen.getByText(mockMovieData.description)).toBeInTheDocument();
    });

    it("handles movie with minimal data", () => {
      const minimalData = {
        id: "1",
        title: "Movie",
        description: "Desc",
      };

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: minimalData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByText("Movie")).toBeInTheDocument();
    });

    it("handles movie with empty strings", () => {
      const emptyData = {
        id: "1",
        title: "",
        description: "",
      };

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: emptyData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });

    it("handles movie with special characters in title", () => {
      const specialData = {
        ...mockMovieData,
        title: "Movie & Show: The \"Best\" <Title>",
      };

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: specialData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByText(/Movie & Show/)).toBeInTheDocument();
    });

    it("handles movie with unicode characters", () => {
      const unicodeData = {
        ...mockMovieData,
        title: "Movie 😀 中文",
      };

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: unicodeData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByText("Movie 😀 中文")).toBeInTheDocument();
    });

    it("handles movie with long description", () => {
      const longData = {
        ...mockMovieData,
        description: "A".repeat(500),
      };

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: longData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid re-renders", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      const { rerender } = render(<BillboardMovie />);
      rerender(<BillboardMovie />);
      rerender(<BillboardMovie />);
      rerender(<BillboardMovie />);

      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });

    it("handles hook data changes", () => {
      const { rerender } = render(<BillboardMovie />);

      const firstMovie = { ...mockMovieData, title: "First Movie" };
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: firstMovie,
        isLoading: false,
      });
      rerender(<BillboardMovie />);
      expect(screen.getByText("First Movie")).toBeInTheDocument();

      const secondMovie = { ...mockMovieData, title: "Second Movie" };
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: secondMovie,
        isLoading: false,
      });
      rerender(<BillboardMovie />);
      expect(screen.getByText("Second Movie")).toBeInTheDocument();
    });

    it("handles switching between loading states", () => {
      const { rerender } = render(<BillboardMovie />);

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });
      rerender(<BillboardMovie />);
      expect(screen.getByTestId("billboard-loading")).toBeInTheDocument();

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
      });
      rerender(<BillboardMovie />);
      expect(screen.getByTestId("billboard-no-data")).toBeInTheDocument();
    });

    it("handles undefined hook return", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue(undefined);

      // Component will throw because it tries to destructure undefined
      // This is expected behavior - the hook should always return an object
      expect(() => render(<BillboardMovie />)).toThrow();
    });

    it("maintains component stability across renders", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      const { container, rerender } = render(<BillboardMovie />);
      const firstHtml = container.innerHTML;

      rerender(<BillboardMovie />);
      const secondHtml = container.innerHTML;

      expect(firstHtml).toBe(secondHtml);
    });
  });

  describe("Component Structure", () => {
    it("returns a single component", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      const { container } = render(<BillboardMovie />);
      expect(container.firstChild).toBeDefined();
    });

    it("uses BillboardBase as child component", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });

    it("does not render multiple BillboardBase components", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      const billboards = screen.queryAllByTestId("billboard-base");
      expect(billboards).toHaveLength(1);
    });

    it("component is a functional component", () => {
      expect(typeof BillboardMovie).toBe("function");
    });

    it("component does not have displayName", () => {
      expect((BillboardMovie as any).displayName).toBeUndefined();
    });
  });

  describe("Mock Verification", () => {
    it("hook mock is properly configured", () => {
      expect(useBillboradMovie).toBeDefined();
      expect(jest.isMockFunction(useBillboradMovie)).toBe(true);
    });

    it("can reset hook mock", () => {
      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: mockMovieData,
        isLoading: false,
      });

      render(<BillboardMovie />);
      jest.clearAllMocks();

      (useBillboradMovie as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
      });

      render(<BillboardMovie />);
      expect(useBillboradMovie).toHaveBeenCalled();
    });

    it("mock data structure is valid", () => {
      expect(mockMovieData.id).toBeDefined();
      expect(mockMovieData.title).toBeDefined();
      expect(mockMovieData.description).toBeDefined();
    });

    it("can override mock return values", () => {
      const customReturn = {
        data: { ...mockMovieData, title: "Override" },
        isLoading: false,
      };

      (useBillboradMovie as jest.Mock).mockReturnValue(customReturn);
      render(<BillboardMovie />);

      expect(screen.getByText("Override")).toBeInTheDocument();
    });
  });
});
