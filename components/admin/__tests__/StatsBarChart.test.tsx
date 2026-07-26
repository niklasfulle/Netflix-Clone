import { render, screen } from "@testing-library/react";
import StatsBarChart from "../StatsBarChart";

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children, data }: any) => <div data-testid="bar-chart" data-count={data.length}>{children}</div>,
  Bar: ({ dataKey, name }: any) => <div data-testid={`bar-${dataKey}`}>{name}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

it("renders monthly movie and series bars", () => {
  render(<StatsBarChart data={[{ month: "2026-07", movies: 3, series: 2 }]} />);
  expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-count", "1");
  expect(screen.getByTestId("bar-movies")).toHaveTextContent("Movies");
  expect(screen.getByTestId("bar-series")).toHaveTextContent("Series");
});
