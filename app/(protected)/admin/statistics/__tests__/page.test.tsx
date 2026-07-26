import { render, screen } from "@testing-library/react";
import useSWR from "swr";
import AdminStatsPage from "../page";

jest.mock("swr");
jest.mock("next/dynamic", () => () => ({ data }: any) => <div>Chart points: {data.length}</div>);

it("renders period metrics and analytics sections", () => {
  (useSWR as jest.Mock).mockReturnValue({
    data: {
      periodViews: 100, changePercent: 12, totalViews: 1000, activeUsers: 7, users: 10, averageProgress: 65,
      movies: 8, series: 3, viewsTimeline: [{ day: "2026-01-01", views: 2 }], monthly: [{ month: "2026-01", movies: 1, series: 1 }],
      topContent: [{ id: "m1", title: "Top Film", type: "Movie", genre: "Drama", views: 12 }],
      genreDistribution: [{ genre: "Drama", views: 12 }],
    },
    error: undefined, isLoading: false,
  });
  render(<AdminStatsPage />);
  expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
  expect(screen.getByText("Top Film")).toBeInTheDocument();
  expect(screen.getByText("Ø Fortschritt")).toBeInTheDocument();
  expect(screen.getAllByText("Chart points: 1")).toHaveLength(2);
});
