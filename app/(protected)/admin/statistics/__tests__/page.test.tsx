import { fireEvent, render, screen } from "@testing-library/react";
import useSWR from "swr";
import AdminStatsPage from "../page";

jest.mock("swr");
jest.mock("next/dynamic", () => () => function MockChart({ data }: any) {
  return <div>Chart points: {data.length}</div>;
});

const mockedUseSWR = useSWR as jest.Mock;
const analyticsData = {
  periodViews: 100,
  changePercent: 12,
  totalViews: 1000,
  activeUsers: 7,
  users: 10,
  averageProgress: 65,
  movies: 8,
  series: 3,
  viewsTimeline: [{ day: "2026-01-01", views: 2 }],
  monthly: [{ month: "2026-01", movies: 1, series: 1 }],
  topContent: [{ id: "m1", title: "Top Film", type: "Movie", genre: "Drama", views: 12 }],
  genreDistribution: [{ genre: "Drama", views: 12 }],
};

beforeEach(() => {
  mockedUseSWR.mockReset();
});

it("renders period metrics and analytics sections", () => {
  mockedUseSWR.mockReturnValue({
    data: analyticsData,
    error: undefined, isLoading: false,
  });
  render(<AdminStatsPage />);
  expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
  expect(screen.getByText("Top Film")).toBeInTheDocument();
  expect(screen.getByText("Ø Fortschritt")).toBeInTheDocument();
  expect(screen.getAllByText("Chart points: 1")).toHaveLength(2);
});

it("changes the analytics period and requests the matching endpoint", () => {
  mockedUseSWR.mockReturnValue({ data: analyticsData, error: undefined, isLoading: false });
  render(<AdminStatsPage />);

  fireEvent.change(screen.getByLabelText("Analysezeitraum"), { target: { value: "90" } });

  expect(mockedUseSWR).toHaveBeenLastCalledWith(
    "/api/statistics/admin-overview?days=90",
    expect.any(Function),
  );
  expect(screen.getByText("Views (90 Tage)")).toBeInTheDocument();
});

it("renders loading, error and empty analytics states", () => {
  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: undefined, isLoading: true });
  const { rerender } = render(<AdminStatsPage />);
  expect(screen.getAllByText("", { selector: ".animate-pulse" })).toHaveLength(5);

  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: new Error("Analytics offline"), isLoading: false });
  rerender(<AdminStatsPage />);
  expect(screen.getByRole("alert")).toHaveTextContent("Analytics offline");

  mockedUseSWR.mockReturnValueOnce({
    data: { ...analyticsData, changePercent: -8, topContent: [], genreDistribution: [] },
    error: undefined,
    isLoading: false,
  });
  rerender(<AdminStatsPage />);
  expect(screen.getByText("Keine Wiedergaben vorhanden.")).toBeInTheDocument();
  expect(screen.getByText("-8% zum Vorzeitraum")).toBeInTheDocument();
});

it("exports the visible analytics rows as CSV", () => {
  mockedUseSWR.mockReturnValue({
    data: {
      ...analyticsData,
      topContent: [{ ...analyticsData.topContent[0], title: 'Film "Zitat"' }],
    },
    error: undefined,
    isLoading: false,
  });
  const createObjectURL = jest.fn(() => "blob:analytics");
  const revokeObjectURL = jest.fn();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

  render(<AdminStatsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Export/i }));

  expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  expect(click).toHaveBeenCalled();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:analytics");
  click.mockRestore();
});

it("validates successful and failing statistics responses", async () => {
  mockedUseSWR.mockReturnValue({ data: analyticsData, error: undefined, isLoading: false });
  render(<AdminStatsPage />);
  const fetchStatistics = mockedUseSWR.mock.calls[0][1];
  const fetchMock = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => analyticsData } as Response)
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Keine Berechtigung" }) } as Response);
  globalThis.fetch = fetchMock;

  await expect(fetchStatistics("/api/statistics/admin-overview?days=30")).resolves.toEqual(analyticsData);
  await expect(fetchStatistics("/api/statistics/admin-overview?days=30")).rejects.toThrow("Keine Berechtigung");
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});
