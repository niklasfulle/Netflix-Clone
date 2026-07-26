import { render, screen } from "@testing-library/react";
import useSWR from "swr";

import AdminHomePage from "../page";

jest.mock("swr");
jest.mock("next/image", () => (props: any) => <img {...props} alt={props.alt || ""} />);
jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

const mockedUseSWR = useSWR as jest.Mock;

it("renders dashboard metrics, top content and quick actions", () => {
  mockedUseSWR.mockReturnValue({
    data: {
      counts: { users: 12, newUsers: 2, movies: 8, series: 4, newContent: 3, actors: 20, views: 900, activeProfiles: 6, blockedUsers: 1, errors24h: 0 },
      topContent: [{ id: "m1", title: "Top Film", type: "Movie", views: 44 }],
      recentContent: [],
      recentActivity: [],
    },
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
