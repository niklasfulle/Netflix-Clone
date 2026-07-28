import { render, screen } from "@testing-library/react";
import useSWR from "swr";

import AdminHomePage from "../page";

jest.mock("swr");
jest.mock("next/image", () => function MockImage(props: any) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt || ""} />;
});
jest.mock("next/link", () => function MockLink({ children, href }: any) {
  return <a href={href}>{children}</a>;
});

const mockedUseSWR = useSWR as jest.Mock;

const dashboardData = {
  counts: {
    users: 12,
    newUsers: 2,
    movies: 8,
    series: 4,
    newContent: 3,
    actors: 20,
    views: 900,
    activeProfiles: 6,
    blockedUsers: 1,
    errors24h: 0,
  },
  topContent: [{ id: "m1", title: "Top Film", type: "Movie", views: 44 }],
  recentContent: [],
  recentActivity: [],
};

beforeEach(() => {
  mockedUseSWR.mockReset();
});

it("renders dashboard metrics, top content and quick actions", () => {
  mockedUseSWR.mockReturnValue({
    data: dashboardData,
    error: undefined,
    isLoading: false,
  });
  render(<AdminHomePage />);
  expect(screen.getByRole("heading", { name: "Guten Überblick." })).toBeInTheDocument();
  expect(screen.getByText("Gesamtaufrufe")).toBeInTheDocument();
  expect(screen.getByText("Top Film")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /Neuer Inhalt|Inhalt hinzufügen/i }).length).toBeGreaterThan(0);
});

it("renders a recoverable error state", () => {
  mockedUseSWR.mockReturnValue({ data: undefined, error: new Error("fail"), isLoading: false });
  render(<AdminHomePage />);
  expect(screen.getByRole("alert")).toHaveTextContent(/konnte nicht geladen/i);
});

it("renders the loading skeleton without dashboard data", () => {
  mockedUseSWR.mockReturnValue({ data: undefined, error: undefined, isLoading: true });
  render(<AdminHomePage />);
  expect(screen.getByLabelText("Dashboard wird geladen")).toBeInTheDocument();
  expect(screen.queryByLabelText("Kennzahlen")).not.toBeInTheDocument();
});

it("renders empty states, recent content and every activity tone", () => {
  mockedUseSWR.mockReturnValue({
    data: {
      ...dashboardData,
      topContent: [],
      recentContent: [{
        id: "recent-1",
        title: "Neu im Katalog",
        type: "Serie",
        status: "DRAFT",
        thumbnailUrl: "/recent.jpg",
      }],
      recentActivity: [
        { timestamp: "2026-07-26T12:30:00.000Z", action: "Import fehlgeschlagen", level: "error" },
        { timestamp: "2026-07-26T12:31:00.000Z", action: "Langsamer Upload", level: "warn" },
        { timestamp: "2026-07-26T12:32:00.000Z", action: "Film veröffentlicht", level: "info" },
        { timestamp: undefined, action: undefined, level: undefined },
      ],
    },
    error: undefined,
    isLoading: false,
  });

  render(<AdminHomePage />);

  expect(screen.getByText("Noch keine Aufrufe vorhanden.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Neu im Katalog/i })).toHaveAttribute("href", "/edit_movie/recent-1");
  expect(screen.getByText("Import fehlgeschlagen").previousSibling).toHaveClass("bg-red-500");
  expect(screen.getByText("Langsamer Upload").previousSibling).toHaveClass("bg-amber-400");
  expect(screen.getByText("Film veröffentlicht").previousSibling).toHaveClass("bg-emerald-400");
  expect(screen.getByText("Unbekannte Aktivität")).toBeInTheDocument();
  expect(screen.getAllByText("–").length).toBeGreaterThan(0);
});

it("uses fallback labels for deleted top content", () => {
  mockedUseSWR.mockReturnValue({
    data: {
      ...dashboardData,
      topContent: [{ id: "deleted", title: "", type: "", views: 1200 }],
    },
    error: undefined,
    isLoading: false,
  });

  render(<AdminHomePage />);
  expect(screen.getByText("Gelöschter Inhalt")).toBeInTheDocument();
  expect(screen.getByText("1.200 Views")).toBeInTheDocument();
});

it("configures SWR with a refresh interval and validates API responses", async () => {
  mockedUseSWR.mockReturnValue({ data: dashboardData, error: undefined, isLoading: false });
  render(<AdminHomePage />);

  expect(mockedUseSWR).toHaveBeenCalledWith(
    "/api/admin/overview",
    expect.any(Function),
    { refreshInterval: 60_000 },
  );
  const fetchDashboard = mockedUseSWR.mock.calls[0][1];
  const fetchMock = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => dashboardData } as Response)
    .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
  globalThis.fetch = fetchMock;

  await expect(fetchDashboard("/api/admin/overview")).resolves.toEqual(dashboardData);
  await expect(fetchDashboard("/api/admin/overview")).rejects.toThrow("Dashboard konnte nicht geladen werden.");
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});
