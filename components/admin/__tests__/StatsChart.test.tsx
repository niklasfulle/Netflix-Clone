import React from "react";
import { render, screen } from "@testing-library/react";
import StatsChart from "../StatsChart";

// Mock recharts components
jest.mock("recharts", () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, strokeWidth, dot, type, name }: any) => (
    <div
      data-testid={`line-${dataKey}`}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
      data-dot={dot}
      data-type={type}
      data-name={name}
    >
      Line: {name}
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

describe("StatsChart Component", () => {
  const mockData = [
    { day: "Mon", movies: 10, series: 5 },
    { day: "Tue", movies: 15, series: 8 },
    { day: "Wed", movies: 12, series: 6 },
  ];

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should render the main container", () => {
      const { container } = render(<StatsChart data={mockData} />);
      const mainDiv = container.querySelector(".w-full");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should render ResponsiveContainer", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should render LineChart", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("should render with empty data", () => {
      render(<StatsChart data={[]} />);
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });
  });

  describe("Chart Components", () => {
    it("should render CartesianGrid", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    });

    it("should render XAxis", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    });

    it("should render YAxis", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    });

    it("should render Tooltip", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    });

    it("should render Legend", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });

    it("should render movies Line", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("line-movies")).toBeInTheDocument();
    });

    it("should render series Line", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("line-series")).toBeInTheDocument();
    });
  });

  describe("Data Handling", () => {
    it("should pass data to LineChart", () => {
      render(<StatsChart data={mockData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(3);
    });

    it("should handle data with day property", () => {
      render(<StatsChart data={mockData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0]).toHaveProperty("day");
    });

    it("should handle data with movies property", () => {
      render(<StatsChart data={mockData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0]).toHaveProperty("movies");
    });

    it("should handle data with series property", () => {
      render(<StatsChart data={mockData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0]).toHaveProperty("series");
    });

    it("should create a copy of readonly data", () => {
      render(<StatsChart data={mockData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toEqual(mockData);
    });

    it("should handle single data point", () => {
      const singleData = [{ day: "Mon", movies: 10, series: 5 }];
      render(<StatsChart data={singleData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(1);
    });

    it("should handle multiple data points", () => {
      const multipleData = Array(7)
        .fill(0)
        .map((_, i) => ({
          day: `Day${i}`,
          movies: i * 2,
          series: i,
        }));
      render(<StatsChart data={multipleData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(7);
    });
  });

  describe("Chart Configuration", () => {
    it("should configure XAxis with day dataKey", () => {
      render(<StatsChart data={mockData} />);
      const xAxis = screen.getByTestId("x-axis");
      expect(xAxis.getAttribute("data-key")).toBe("day");
    });

    it("should configure XAxis stroke color", () => {
      render(<StatsChart data={mockData} />);
      const xAxis = screen.getByTestId("x-axis");
      expect(xAxis.getAttribute("data-stroke")).toBe("#a1a1aa");
    });

    it("should configure YAxis stroke color", () => {
      render(<StatsChart data={mockData} />);
      const yAxis = screen.getByTestId("y-axis");
      expect(yAxis.getAttribute("data-stroke")).toBe("#a1a1aa");
    });

    it("should configure YAxis to not allow decimals", () => {
      render(<StatsChart data={mockData} />);
      const yAxis = screen.getByTestId("y-axis");
      expect(yAxis.getAttribute("data-allow-decimals")).toBe("false");
    });

    it("should configure CartesianGrid stroke", () => {
      render(<StatsChart data={mockData} />);
      const grid = screen.getByTestId("cartesian-grid");
      expect(grid.getAttribute("data-stroke")).toBe("#52525b");
    });

    it("should configure CartesianGrid dasharray", () => {
      render(<StatsChart data={mockData} />);
      const grid = screen.getByTestId("cartesian-grid");
      expect(grid.getAttribute("data-dasharray")).toBe("3 3");
    });
  });

  describe("Line Configuration", () => {
    it("should configure movies line dataKey", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      expect(moviesLine).toBeInTheDocument();
    });

    it("should configure movies line stroke color", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      expect(moviesLine.getAttribute("data-stroke")).toBe("#22d3ee");
    });

    it("should configure movies line name", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      expect(moviesLine.getAttribute("data-name")).toBe("Movies");
    });

    it("should configure movies line stroke width", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      expect(moviesLine.getAttribute("data-stroke-width")).toBe("3");
    });

    it("should configure movies line type as monotone", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      expect(moviesLine.getAttribute("data-type")).toBe("monotone");
    });

    it("should configure movies line without dots", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      expect(moviesLine.getAttribute("data-dot")).toBe("false");
    });

    it("should configure series line dataKey", () => {
      render(<StatsChart data={mockData} />);
      const seriesLine = screen.getByTestId("line-series");
      expect(seriesLine).toBeInTheDocument();
    });

    it("should configure series line stroke color", () => {
      render(<StatsChart data={mockData} />);
      const seriesLine = screen.getByTestId("line-series");
      expect(seriesLine.getAttribute("data-stroke")).toBe("#a78bfa");
    });

    it("should configure series line name", () => {
      render(<StatsChart data={mockData} />);
      const seriesLine = screen.getByTestId("line-series");
      expect(seriesLine.getAttribute("data-name")).toBe("Series");
    });

    it("should configure series line stroke width", () => {
      render(<StatsChart data={mockData} />);
      const seriesLine = screen.getByTestId("line-series");
      expect(seriesLine.getAttribute("data-stroke-width")).toBe("3");
    });

    it("should configure series line type as monotone", () => {
      render(<StatsChart data={mockData} />);
      const seriesLine = screen.getByTestId("line-series");
      expect(seriesLine.getAttribute("data-type")).toBe("monotone");
    });

    it("should configure series line without dots", () => {
      render(<StatsChart data={mockData} />);
      const seriesLine = screen.getByTestId("line-series");
      expect(seriesLine.getAttribute("data-dot")).toBe("false");
    });
  });

  describe("Tooltip Configuration", () => {
    it("should configure Tooltip contentStyle", () => {
      render(<StatsChart data={mockData} />);
      const tooltip = screen.getByTestId("tooltip");
      const style = JSON.parse(tooltip.getAttribute("data-style") || "{}");
      expect(style.background).toBe("#18181b");
    });

    it("should configure Tooltip border", () => {
      render(<StatsChart data={mockData} />);
      const tooltip = screen.getByTestId("tooltip");
      const style = JSON.parse(tooltip.getAttribute("data-style") || "{}");
      expect(style.border).toBe("1px solid #52525b");
    });

    it("should configure Tooltip text color", () => {
      render(<StatsChart data={mockData} />);
      const tooltip = screen.getByTestId("tooltip");
      const style = JSON.parse(tooltip.getAttribute("data-style") || "{}");
      expect(style.color).toBe("#fff");
    });
  });

  describe("Legend Configuration", () => {
    it("should configure Legend wrapperStyle", () => {
      render(<StatsChart data={mockData} />);
      const legend = screen.getByTestId("legend");
      const style = JSON.parse(legend.getAttribute("data-style") || "{}");
      expect(style.color).toBe("#fff");
    });
  });

  describe("Responsive Container Configuration", () => {
    it("should configure ResponsiveContainer width", () => {
      render(<StatsChart data={mockData} />);
      const container = screen.getByTestId("responsive-container");
      expect(container.getAttribute("data-width")).toBe("100%");
    });

    it("should configure ResponsiveContainer height", () => {
      render(<StatsChart data={mockData} />);
      const container = screen.getByTestId("responsive-container");
      expect(container.getAttribute("data-height")).toBe("100%");
    });
  });

  describe("Container Styling", () => {
    it("should have full width class", () => {
      const { container } = render(<StatsChart data={mockData} />);
      const mainDiv = container.querySelector(".w-full");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should have responsive height classes", () => {
      const { container } = render(<StatsChart data={mockData} />);
      const mainDiv = container.querySelector(".h-\\[420px\\]");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should have md breakpoint height class", () => {
      const { container } = render(<StatsChart data={mockData} />);
      const mainDiv = container.querySelector(".md\\:h-\\[520px\\]");
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe("TypeScript Props", () => {
    it("should accept readonly data prop", () => {
      const readonlyData: ReadonlyArray<{ day: string; movies: number; series: number }> = mockData;
      expect(() => render(<StatsChart data={readonlyData} />)).not.toThrow();
    });

    it("should accept data with required properties", () => {
      const validData = [{ day: "Mon", movies: 10, series: 5 }];
      expect(() => render(<StatsChart data={validData} />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero values", () => {
      const zeroData = [{ day: "Mon", movies: 0, series: 0 }];
      render(<StatsChart data={zeroData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].movies).toBe(0);
      expect(chartData[0].series).toBe(0);
    });

    it("should handle large numbers", () => {
      const largeData = [{ day: "Mon", movies: 1000000, series: 500000 }];
      render(<StatsChart data={largeData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].movies).toBe(1000000);
    });

    it("should handle negative numbers", () => {
      const negativeData = [{ day: "Mon", movies: -10, series: -5 }];
      render(<StatsChart data={negativeData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].movies).toBe(-10);
    });

    it("should handle long day names", () => {
      const longDayData = [{ day: "Wednesday", movies: 10, series: 5 }];
      render(<StatsChart data={longDayData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].day).toBe("Wednesday");
    });

    it("should handle special characters in day", () => {
      const specialData = [{ day: "Mon 1/1", movies: 10, series: 5 }];
      render(<StatsChart data={specialData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData[0].day).toBe("Mon 1/1");
    });

    it("should handle week data (7 days)", () => {
      const weekData = [
        { day: "Mon", movies: 10, series: 5 },
        { day: "Tue", movies: 12, series: 6 },
        { day: "Wed", movies: 8, series: 4 },
        { day: "Thu", movies: 15, series: 7 },
        { day: "Fri", movies: 20, series: 10 },
        { day: "Sat", movies: 25, series: 12 },
        { day: "Sun", movies: 18, series: 9 },
      ];
      render(<StatsChart data={weekData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(chartData).toHaveLength(7);
    });
  });

  describe("Component Structure", () => {
    it("should have ResponsiveContainer as wrapper", () => {
      render(<StatsChart data={mockData} />);
      const container = screen.getByTestId("responsive-container");
      expect(container).toBeInTheDocument();
    });

    it("should have LineChart inside ResponsiveContainer", () => {
      render(<StatsChart data={mockData} />);
      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeInTheDocument();
    });

    it("should render all chart elements", () => {
      render(<StatsChart data={mockData} />);
      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
      expect(screen.getByTestId("x-axis")).toBeInTheDocument();
      expect(screen.getByTestId("y-axis")).toBeInTheDocument();
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
      expect(screen.getByTestId("legend")).toBeInTheDocument();
      expect(screen.getByTestId("line-movies")).toBeInTheDocument();
      expect(screen.getByTestId("line-series")).toBeInTheDocument();
    });
  });

  describe("Data Immutability", () => {
    it("should not modify original data array", () => {
      const originalData = [{ day: "Mon", movies: 10, series: 5 }];
      const dataCopy = [...originalData];
      render(<StatsChart data={originalData} />);
      expect(originalData).toEqual(dataCopy);
    });

    it("should spread readonly data into mutable array", () => {
      render(<StatsChart data={mockData} />);
      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data") || "[]");
      expect(Array.isArray(chartData)).toBe(true);
    });
  });

  describe("Color Scheme", () => {
    it("should use cyan color for movies", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      expect(moviesLine.getAttribute("data-stroke")).toBe("#22d3ee");
    });

    it("should use purple color for series", () => {
      render(<StatsChart data={mockData} />);
      const seriesLine = screen.getByTestId("line-series");
      expect(seriesLine.getAttribute("data-stroke")).toBe("#a78bfa");
    });

    it("should use zinc colors for axes", () => {
      render(<StatsChart data={mockData} />);
      const xAxis = screen.getByTestId("x-axis");
      const yAxis = screen.getByTestId("y-axis");
      expect(xAxis.getAttribute("data-stroke")).toBe("#a1a1aa");
      expect(yAxis.getAttribute("data-stroke")).toBe("#a1a1aa");
    });

    it("should use dark background for tooltip", () => {
      render(<StatsChart data={mockData} />);
      const tooltip = screen.getByTestId("tooltip");
      const style = JSON.parse(tooltip.getAttribute("data-style") || "{}");
      expect(style.background).toBe("#18181b");
    });
  });

  describe("Line Style", () => {
    it("should use monotone line type for smooth curves", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      const seriesLine = screen.getByTestId("line-series");
      expect(moviesLine.getAttribute("data-type")).toBe("monotone");
      expect(seriesLine.getAttribute("data-type")).toBe("monotone");
    });

    it("should use consistent stroke width for both lines", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      const seriesLine = screen.getByTestId("line-series");
      expect(moviesLine.getAttribute("data-stroke-width")).toBe("3");
      expect(seriesLine.getAttribute("data-stroke-width")).toBe("3");
    });

    it("should disable dots on both lines", () => {
      render(<StatsChart data={mockData} />);
      const moviesLine = screen.getByTestId("line-movies");
      const seriesLine = screen.getByTestId("line-series");
      expect(moviesLine.getAttribute("data-dot")).toBe("false");
      expect(seriesLine.getAttribute("data-dot")).toBe("false");
    });
  });
});
