import { render, screen } from "@testing-library/react";
import StatsChart from "../StatsChart";

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: ({ dataKey, name }: any) => <div data-testid={`line-${dataKey}`}>{name}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

it("renders a dedicated views line for analytics data", () => {
  render(<StatsChart data={[{ day: "2026-07-26", views: 12 }]} />);
  expect(screen.getByTestId("line-views")).toHaveTextContent("Aufrufe");
  expect(screen.queryByTestId("line-movies")).not.toBeInTheDocument();
});

it("keeps the movie and series growth mode", () => {
  render(<StatsChart data={[{ day: "2026-07-26", movies: 2, series: 1 }]} />);
  expect(screen.getByTestId("line-movies")).toBeInTheDocument();
  expect(screen.getByTestId("line-series")).toBeInTheDocument();
});
