import React from "react";
import { render, screen } from "@testing-library/react";
import BillboardSeries from "../BillboardSeries";

// Mock the hook
jest.mock("@/hooks/series/useBillboradSeries");

// Mock BillboardBase component
jest.mock("@/components/BillboardBase", () => {
  return function MockBillboardBase({ data, isLoading }: any) {
    return (
      <div data-testid="billboard-base">
        <span>Data ID: {data?.id || "none"}</span>
        <span>Loading: {String(isLoading)}</span>
      </div>
    );
  };
});

// Import after mocks
import useBillboradSeries from "@/hooks/series/useBillboradSeries";

const mockUseBillboradSeries = useBillboradSeries as jest.MockedFunction<
  typeof useBillboradSeries
>;

describe("BillboardSeries", () => {
  const mockSeriesData = {
    id: "series-1",
    title: "Test Series",
    description: "Test Description",
    videoUrl: "/videos/series.mp4",
    thumbnailUrl: "/images/series.jpg",
    genre: "Drama",
    duration: "45 min",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBillboradSeries.mockReturnValue({
      data: mockSeriesData,
      error: null,
      isLoading: false,
    } as any);
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<BillboardSeries />);
      expect(container).toBeTruthy();
    });

    it("renders BillboardBase component", () => {
      render(<BillboardSeries />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });

    it("calls useBillboradSeries hook", () => {
      render(<BillboardSeries />);
      expect(mockUseBillboradSeries).toHaveBeenCalled();
    });
  });

  describe("Props Passing", () => {
    it("passes data prop to BillboardBase", () => {
      render(<BillboardSeries />);
      expect(screen.getByText("Data ID: series-1")).toBeInTheDocument();
    });

    it("passes isLoading prop to BillboardBase", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: mockSeriesData,
        isLoading: true,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("passes isLoading false to BillboardBase when not loading", () => {
      render(<BillboardSeries />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
    });

    it("passes correct data object to BillboardBase", () => {
      const customSeries = {
        ...mockSeriesData,
        id: "custom-series",
        title: "Custom Series",
      };

      mockUseBillboradSeries.mockReturnValue({
        data: customSeries,
        isLoading: false,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Data ID: custom-series")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("renders with loading state true", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("renders with loading state false", () => {
      render(<BillboardSeries />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
    });

    it("handles loading to loaded transition", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { rerender } = render(<BillboardSeries />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();

      mockUseBillboradSeries.mockReturnValue({
        data: mockSeriesData,
        isLoading: false,
      } as any);

      rerender(<BillboardSeries />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
      expect(screen.getByText("Data ID: series-1")).toBeInTheDocument();
    });
  });

  describe("Data States", () => {
    it("handles undefined data", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Data ID: none")).toBeInTheDocument();
    });

    it("handles null data", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: null,
        isLoading: false,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Data ID: none")).toBeInTheDocument();
    });

    it("renders with complete series data", () => {
      render(<BillboardSeries />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
      expect(screen.getByText("Data ID: series-1")).toBeInTheDocument();
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
    });

    it("handles series data with minimal properties", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: { id: "minimal-series" },
        isLoading: false,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Data ID: minimal-series")).toBeInTheDocument();
    });
  });

  describe("Hook Return Values", () => {
    it("handles hook returning only data", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: mockSeriesData,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });

    it("handles hook returning only isLoading", () => {
      mockUseBillboradSeries.mockReturnValue({
        isLoading: true,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("handles empty hook return", () => {
      mockUseBillboradSeries.mockReturnValue({} as any);

      render(<BillboardSeries />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });
  });

  describe("Multiple Renders", () => {
    it("calls hook on each render", () => {
      const { rerender } = render(<BillboardSeries />);
      expect(mockUseBillboradSeries).toHaveBeenCalledTimes(1);

      rerender(<BillboardSeries />);
      expect(mockUseBillboradSeries).toHaveBeenCalledTimes(2);
    });

    it("updates when hook data changes", () => {
      const { rerender } = render(<BillboardSeries />);
      expect(screen.getByText("Data ID: series-1")).toBeInTheDocument();

      mockUseBillboradSeries.mockReturnValue({
        data: { ...mockSeriesData, id: "series-2" },
        isLoading: false,
      } as any);

      rerender(<BillboardSeries />);
      expect(screen.getByText("Data ID: series-2")).toBeInTheDocument();
    });

    it("updates when loading state changes", () => {
      const { rerender } = render(<BillboardSeries />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();

      mockUseBillboradSeries.mockReturnValue({
        data: mockSeriesData,
        isLoading: true,
      } as any);

      rerender(<BillboardSeries />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles series with empty id", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: { ...mockSeriesData, id: "" },
        isLoading: false,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });

    it("handles series with very long id", () => {
      const longId = "a".repeat(1000);
      mockUseBillboradSeries.mockReturnValue({
        data: { ...mockSeriesData, id: longId },
        isLoading: false,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText(`Data ID: ${longId}`)).toBeInTheDocument();
    });

    it("handles series with special characters in id", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: { ...mockSeriesData, id: "series-!@#$%^&*()" },
        isLoading: false,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Data ID: series-!@#$%^&*()")).toBeInTheDocument();
    });

    it("handles rapid state changes", () => {
      const { rerender } = render(<BillboardSeries />);

      for (let i = 0; i < 5; i++) {
        mockUseBillboradSeries.mockReturnValue({
          data: { ...mockSeriesData, id: `series-${i}` },
          isLoading: i % 2 === 0,
        } as any);
        rerender(<BillboardSeries />);
      }

      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders complete component with all props", () => {
      render(<BillboardSeries />);

      expect(mockUseBillboradSeries).toHaveBeenCalled();
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
      expect(screen.getByText("Data ID: series-1")).toBeInTheDocument();
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
    });

    it("handles complete loading workflow", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { rerender } = render(<BillboardSeries />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
      expect(screen.getByText("Data ID: none")).toBeInTheDocument();

      mockUseBillboradSeries.mockReturnValue({
        data: mockSeriesData,
        isLoading: false,
      } as any);

      rerender(<BillboardSeries />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
      expect(screen.getByText("Data ID: series-1")).toBeInTheDocument();
    });

    it("maintains component stability across renders", () => {
      mockUseBillboradSeries.mockReturnValue({
        data: mockSeriesData,
        error: null,
        isLoading: false,
      } as any);

      const { container, rerender } = render(<BillboardSeries />);
      const firstHtml = container.innerHTML;

      rerender(<BillboardSeries />);
      const secondHtml = container.innerHTML;

      expect(firstHtml).toBe(secondHtml);
    });
  });

  describe("Component Structure", () => {
    it("returns BillboardBase component", () => {
      const { container } = render(<BillboardSeries />);
      expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
      expect(container.querySelector('[data-testid="billboard-base"]')).toBeTruthy();
    });
  });

  describe("Hook Call Verification", () => {
    it("calls useBillboradSeries exactly once per render", () => {
      render(<BillboardSeries />);
      expect(mockUseBillboradSeries).toHaveBeenCalledTimes(1);
    });

    it("calls useBillboradSeries with no arguments", () => {
      render(<BillboardSeries />);
      expect(mockUseBillboradSeries).toHaveBeenCalledWith();
    });

    it("uses hook return value immediately", () => {
      const customData = { id: "immediate-series" };
      mockUseBillboradSeries.mockReturnValue({
        data: customData,
        isLoading: false,
      } as any);

      render(<BillboardSeries />);
      expect(screen.getByText("Data ID: immediate-series")).toBeInTheDocument();
    });
  });

  describe("Different Series Types", () => {
    it("handles series with different genres", () => {
      const genres = ["Drama", "Comedy", "Action", "Thriller", "Sci-Fi"];

      genres.forEach((genre) => {
        mockUseBillboradSeries.mockReturnValue({
          data: { ...mockSeriesData, genre },
          isLoading: false,
        } as any);

        const { unmount } = render(<BillboardSeries />);
        expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
        unmount();
      });
    });

    it("handles series with different durations", () => {
      const durations = ["30 min", "45 min", "60 min", "90 min"];

      durations.forEach((duration) => {
        mockUseBillboradSeries.mockReturnValue({
          data: { ...mockSeriesData, duration },
          isLoading: false,
        } as any);

        const { unmount } = render(<BillboardSeries />);
        expect(screen.getByTestId("billboard-base")).toBeInTheDocument();
        unmount();
      });
    });

    it("handles series with various data structures", () => {
      const variations = [
        { id: "1", title: "Series 1" },
        { id: "2", title: "Series 2", description: "Description" },
        { id: "3", title: "Series 3", genre: "Drama", duration: "45 min" },
        mockSeriesData,
      ];

      variations.forEach((data) => {
        mockUseBillboradSeries.mockReturnValue({
          data,
          isLoading: false,
        } as any);

        const { unmount } = render(<BillboardSeries />);
        expect(screen.getByText(`Data ID: ${data.id}`)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
