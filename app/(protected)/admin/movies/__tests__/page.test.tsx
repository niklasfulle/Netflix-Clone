import { fireEvent, render, screen } from "@testing-library/react";
import useSWR from "swr";
import AdminMoviesPage from "../page";

jest.mock("swr");
jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);
jest.mock("@/components/admin/MovieAdminTable", () => ({ items }: any) => <div>Table items: {items.length}</div>);

const mockedUseSWR = useSWR as jest.Mock;

it("renders catalog filters and server results", () => {
  mockedUseSWR.mockReturnValue({ data: { movies: [{ id: "m1" }], total: 1, totalPages: 1, filters: { genres: ["Drama"] } }, error: undefined, isLoading: false, mutate: jest.fn() });
  render(<AdminMoviesPage />);
  expect(screen.getByRole("heading", { name: "Inhalte" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Titel oder Beschreibung/i)).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Drama" })).toBeInTheDocument();
  expect(screen.getByText("Table items: 1")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /New Content/i })).toHaveAttribute("href", "/admin/movies/new");
});

it("resets filters", () => {
  mockedUseSWR.mockReturnValue({ data: { movies: [], total: 0, totalPages: 0, filters: { genres: [] } }, error: undefined, isLoading: false, mutate: jest.fn() });
  render(<AdminMoviesPage />);
  const input = screen.getByPlaceholderText(/Titel oder Beschreibung/i);
  fireEvent.change(input, { target: { value: "Dark" } });
  fireEvent.click(screen.getByRole("button", { name: /Filter zurücksetzen/i }));
  expect(input).toHaveValue("");
});
