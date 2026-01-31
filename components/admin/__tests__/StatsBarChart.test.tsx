import React from "react";
import { render, screen } from "@testing-library/react";
import StatsBarChart from "../StatsBarChart";

// Mock recharts components
jest.mock("recharts", () => ({
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, fill, name }: any) => (
    <div data-testid={`bar-${dataKey}`} data-fill={fill} data-name={name}>
      Bar: {name}
    </div>
  ),
  XAxis: ({ dataKey, stroke }: any) => (
    <div data-testid="x-axis" data-key={dataKey} data-stroke={stroke}>
      XAxis
    </div>
  ),
  YAxis: ({ stroke, allowDecimals }: any) => (
    <div data-testid="y-axis" data-stroke={stroke} data-allow-decimals={allowDecimals}>
      YAxis
    </div>
  ),
  CartesianGrid: ({ strokeDasharray, stroke }: any) => (
    <div data-testid="cartesian-grid" data-dasharray={strokeDasharray} data-stroke={stroke}>
      Grid
    </div>
  ),
  Tooltip: ({ contentStyle }: any) => (
    <div data-testid="tooltip" data-style={JSON.stringify(contentStyle)}>
      Tooltip
    </div>
  ),
  Legend: ({ wrapperStyle }: any) => (
    <div data-testid="legend" data-style={JSON.stringify(wrapperStyle)}>
      Legend
    </div>
  ),
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>
      {children}
    </div>
  ),
}));

describe("StatsBarChart Component", () => {
  const mockData = [
    { month: "Jan", movies: 10, series: 5 },
    { month: "Feb", movies: 15, series: 8 },
    { month: "Mar", movies: 12, series: 6 },
  ];

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should render the main container", () => {
      const { container } = render(<StatsBarChart data={mockData} />);
      const mainDiv = container.querySelector(".w-full");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should render ResponsiveContainer", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should render BarChart", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("should render with empty data", () => {
      render(<StatsBarChart data={[]} />);
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  describe("Chart Components", () => {
    it("should render CartesianGrid", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    });

    it("should render XAxis", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    });

    it("should render YAxis", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    });

    it("should render Tooltip", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    });

    it("should render Legend", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });

    it("should render movies Bar", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("bar-movies")).toBeInTheDocument();
    });

    it("should render series Bar", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("bar-series")).toBeInTheDocument();
    });
  });

  describe("Data Handling", () => {
    it("should pass data to BarChart", () => {
      render(<StatsBarChart data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(3);
    });

    it("should handle data with month property", () => {
      render(<StatsBarChart data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0]).toHaveProperty("month");
    });

    it("should handle data with movies property", () => {
      render(<StatsBarChart data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0]).toHaveProperty("movies");
    });

    it("should handle data with series property", () => {
      render(<StatsBarChart data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0]).toHaveProperty("series");
    });

    it("should create a copy of readonly data", () => {
      render(<StatsBarChart data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toEqual(mockData);
    });

    it("should handle single data point", () => {
      const singleData = [{ month: "Jan", movies: 10, series: 5 }];
      render(<StatsBarChart data={singleData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(1);
    });

    it("should handle multiple data points", () => {
      const multipleData = Array(12)
        .fill(0)
        .map((_, i) => ({
          month: `Month${i}`,
          movies: i * 2,
          series: i,
        }));
      render(<StatsBarChart data={multipleData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(12);
    });
  });

  describe("Chart Configuration", () => {
    it("should configure XAxis with month dataKey", () => {
      render(<StatsBarChart data={mockData} />);
      const xAxis = screen.getByTestId("x-axis");
      expect(xAxis.getAttribute("data-key")).toBe("month");
    });

    it("should configure XAxis stroke color", () => {
      render(<StatsBarChart data={mockData} />);
      const xAxis = screen.getByTestId("x-axis");
      expect(xAxis.getAttribute("data-stroke")).toBe("#a1a1aa");
    });

    it("should configure YAxis stroke color", () => {
      render(<StatsBarChart data={mockData} />);
      const yAxis = screen.getByTestId("y-axis");
      expect(yAxis.getAttribute("data-stroke")).toBe("#a1a1aa");
    });

    it("should configure YAxis to not allow decimals", () => {
      render(<StatsBarChart data={mockData} />);
      const yAxis = screen.getByTestId("y-axis");
      expect(yAxis.getAttribute("data-allow-decimals")).toBe("false");
    });

    it("should configure CartesianGrid stroke", () => {
      render(<StatsBarChart data={mockData} />);
      const grid = screen.getByTestId("cartesian-grid");
      expect(grid.getAttribute("data-stroke")).toBe("#52525b");
    });

    it("should configure CartesianGrid dasharray", () => {
      render(<StatsBarChart data={mockData} />);
      const grid = screen.getByTestId("cartesian-grid");
      expect(grid.getAttribute("data-dasharray")).toBe("3 3");
    });
  });

  describe("Bar Configuration", () => {
    it("should configure movies bar dataKey", () => {
      render(<StatsBarChart data={mockData} />);
      const moviesBar = screen.getByTestId("bar-movies");
      expect(moviesBar).toBeInTheDocument();
    });

    it("should configure movies bar color", () => {
      render(<StatsBarChart data={mockData} />);
      const moviesBar = screen.getByTestId("bar-movies");
      expect(moviesBar.getAttribute("data-fill")).toBe("#22d3ee");
    });

    it("should configure movies bar name", () => {
      render(<StatsBarChart data={mockData} />);
      const moviesBar = screen.getByTestId("bar-movies");
      expect(moviesBar.getAttribute("data-name")).toBe("Movies");
    });

    it("should configure series bar dataKey", () => {
      render(<StatsBarChart data={mockData} />);
      const seriesBar = screen.getByTestId("bar-series");
      expect(seriesBar).toBeInTheDocument();
    });

    it("should configure series bar color", () => {
      render(<StatsBarChart data={mockData} />);
      const seriesBar = screen.getByTestId("bar-series");
      expect(seriesBar.getAttribute("data-fill")).toBe("#a78bfa");
    });

    it("should configure series bar name", () => {
      render(<StatsBarChart data={mockData} />);
      const seriesBar = screen.getByTestId("bar-series");
      expect(seriesBar.getAttribute("data-name")).toBe("Series");
    });
  });

  describe("Tooltip Configuration", () => {
    it("should configure Tooltip contentStyle", () => {
      render(<StatsBarChart data={mockData} />);
      const tooltip = screen.getByTestId("tooltip");
      const style = JSON.parse(tooltip.getAttribute("data-style") || "{}");
      expect(style.background).toBe("#18181b");
    });

    it("should configure Tooltip border", () => {
      render(<StatsBarChart data={mockData} />);
      const tooltip = screen.getByTestId("tooltip");
      const style = JSON.parse(tooltip.getAttribute("data-style") || "{}");
      expect(style.border).toBe("1px solid #52525b");
    });

    it("should configure Tooltip text color", () => {
      render(<StatsBarChart data={mockData} />);
      const tooltip = screen.getByTestId("tooltip");
      const style = JSON.parse(tooltip.getAttribute("data-style") || "{}");
      expect(style.color).toBe("#fff");
    });
  });

  describe("Legend Configuration", () => {
    it("should configure Legend wrapperStyle", () => {
      render(<StatsBarChart data={mockData} />);
      const legend = screen.getByTestId("legend");
      const style = JSON.parse(legend.getAttribute("data-style") || "{}");
      expect(style.color).toBe("#fff");
    });
  });

  describe("Responsive Container Configuration", () => {
    it("should configure ResponsiveContainer width", () => {
      render(<StatsBarChart data={mockData} />);
      const container = screen.getByTestId("responsive-container");
      expect(container.getAttribute("data-width")).toBe("100%");
    });

    it("should configure ResponsiveContainer height", () => {
      render(<StatsBarChart data={mockData} />);
      const container = screen.getByTestId("responsive-container");
      expect(container.getAttribute("data-height")).toBe("100%");
    });
  });

  describe("Container Styling", () => {
    it("should have full width class", () => {
      const { container } = render(<StatsBarChart data={mockData} />);
      const mainDiv = container.querySelector(".w-full");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should have responsive height classes", () => {
      const { container } = render(<StatsBarChart data={mockData} />);
      const mainDiv = container.querySelector(".h-\\[420px\\]");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should have md breakpoint height class", () => {
      const { container } = render(<StatsBarChart data={mockData} />);
      const mainDiv = container.querySelector(".md\\:h-\\[520px\\]");
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe("TypeScript Props", () => {
    it("should accept readonly data prop", () => {
      const readonlyData: ReadonlyArray<{ month: string; movies: number; series: number }> = mockData;
      expect(() => render(<StatsBarChart data={readonlyData} />)).not.toThrow();
    });

    it("should accept data with required properties", () => {
      const validData = [{ month: "Jan", movies: 10, series: 5 }];
      expect(() => render(<StatsBarChart data={validData} />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero values", () => {
      const zeroData = [{ month: "Jan", movies: 0, series: 0 }];
      render(<StatsBarChart data={zeroData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].movies).toBe(0);
      expect(chartData[0].series).toBe(0);
    });

    it("should handle large numbers", () => {
      const largeData = [{ month: "Jan", movies: 1000000, series: 500000 }];
      render(<StatsBarChart data={largeData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].movies).toBe(1000000);
    });

    it("should handle negative numbers", () => {
      const negativeData = [{ month: "Jan", movies: -10, series: -5 }];
      render(<StatsBarChart data={negativeData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].movies).toBe(-10);
    });

    it("should handle long month names", () => {
      const longMonthData = [{ month: "December", movies: 10, series: 5 }];
      render(<StatsBarChart data={longMonthData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].month).toBe("December");
    });

    it("should handle special characters in month", () => {
      const specialData = [{ month: "Jan'24", movies: 10, series: 5 }];
      render(<StatsBarChart data={specialData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].month).toBe("Jan'24");
    });
  });

  describe("Component Structure", () => {
    it("should have ResponsiveContainer as wrapper", () => {
      render(<StatsBarChart data={mockData} />);
      const container = screen.getByTestId("responsive-container");
      expect(container).toBeInTheDocument();
    });

    it("should have BarChart inside ResponsiveContainer", () => {
      render(<StatsBarChart data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      expect(barChart).toBeInTheDocument();
    });

    it("should render all chart elements", () => {
      render(<StatsBarChart data={mockData} />);
      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
      expect(screen.getByTestId("legend")).toBeInTheDocument();
      expect(screen.getByTestId("bar-movies")).toBeInTheDocument();
      expect(screen.getByTestId("bar-series")).toBeInTheDocument();
    });
  });

  describe("Data Immutability", () => {
    it("should not modify original data array", () => {
      const originalData = [{ month: "Jan", movies: 10, series: 5 }];
      const dataCopy = [...originalData];
      render(<StatsBarChart data={originalData} />);
      expect(originalData).toEqual(dataCopy);
    });

    it("should spread readonly data into mutable array", () => {
      render(<StatsBarChart data={mockData} />);
      const barChart = screen.getByTestId("bar-chart");
      const chartData = JSON.parse(barChart.getAttribute("data-chart-data") || "[]");
      expect(Array.isArray(chartData)).toBe(true);
    });
  });

  describe("Color Scheme", () => {
    it("should use cyan color for movies", () => {
      render(<StatsBarChart data={mockData} />);
      const moviesBar = screen.getByTestId("bar-movies");
      expect(moviesBar.getAttribute("data-fill")).toBe("#22d3ee");
    });

    it("should use purple color for series", () => {
      render(<StatsBarChart data={mockData} />);
      const seriesBar = screen.getByTestId("bar-series");
      expect(seriesBar.getAttribute("data-fill")).toBe("#a78bfa");
    });

    it("should use zinc colors for axes", () => {
      render(<StatsBarChart data={mockData} />);
      const xAxis = screen.getByTestId("x-axis");
      const yAxis = screen.getByTestId("y-axis");
      expect(xAxis.getAttribute("data-stroke")).toBe("#a1a1aa");
      expect(yAxis.getAttribute("data-stroke")).toBe("#a1a1aa");
    });

    it("should use dark background for tooltip", () => {
      render(<StatsBarChart data={mockData} />);
      const tooltip = screen.getByTestId("tooltip");
      const style = JSON.parse(tooltip.getAttribute("data-style") || "{}");
      expect(style.background).toBe("#18181b");
    });
  });
});
