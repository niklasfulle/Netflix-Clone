import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import useSWR from "swr";
import AdminMoviesPage from "../page";

jest.mock("swr");
jest.mock("next/link", () => function MockLink({ children, href }: any) {
  return <a href={href}>{children}</a>;
});
jest.mock("@/components/admin/MovieAdminTable", () => ({
  __esModule: true,
  default: ({ items, onSelectionChange, onSort, sort, direction }: any) => (
    <div>
      <span>Table items: {items.length}</span>
      <span>Sort: {sort}:{direction}</span>
      <button type="button" onClick={() => onSelectionChange(items.map((item: any) => item.id))}>Alle auswählen</button>
      <button type="button" onClick={() => onSort(sort)}>Aktuelle Spalte sortieren</button>
      <button type="button" onClick={() => onSort("title")}>Nach Titel sortieren</button>
    </div>
  ),
}));
jest.mock("@/components/admin/AdminPagination", () => ({
  AdminPagination: ({ onPageChange, onPageSizeChange }: any) => (
    <div>
      <button type="button" onClick={() => onPageChange(2)}>Seite zwei</button>
      <button type="button" onClick={() => onPageSizeChange(50)}>50 pro Seite</button>
    </div>
  ),
}));

const mockedUseSWR = useSWR as jest.Mock;
const mutate = jest.fn();
const movie = {
  id: "m1",
  title: 'Dark "Movie"',
  type: "Movie",
  genre: "Drama",
  status: "DRAFT",
  views: 15,
};
const catalogData = {
  movies: [movie],
  total: 1,
  totalPages: 1,
  filters: { genres: ["Drama", "Thriller"] },
};

beforeEach(() => {
  mockedUseSWR.mockReset();
  mutate.mockReset();
  mockedUseSWR.mockReturnValue({
    data: catalogData,
    error: undefined,
    isLoading: false,
    mutate,
  });
});

afterEach(() => {
  jest.useRealTimers();
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

it("renders catalog filters and server results", () => {
  render(<AdminMoviesPage />);
  expect(screen.getByRole("heading", { name: "Inhalte" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Titel oder Beschreibung/i)).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Nach Inhaltstyp filtern" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Nach Veröffentlichungsstatus filtern" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Nach Genre filtern" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Nach Darsteller filtern" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Drama" })).toBeInTheDocument();
  expect(screen.getByText("Table items: 1")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /New Content/i })).toHaveAttribute("href", "/admin/movies/new");
});

it("resets filters", () => {
  render(<AdminMoviesPage />);
  const input = screen.getByPlaceholderText(/Titel oder Beschreibung/i);
  fireEvent.change(input, { target: { value: "Dark" } });
  fireEvent.change(screen.getByDisplayValue("Alle Typen"), { target: { value: "Movie" } });
  fireEvent.change(screen.getByDisplayValue("Alle Status"), { target: { value: "DRAFT" } });
  fireEvent.change(screen.getByDisplayValue("Alle Genres"), { target: { value: "Drama" } });
  fireEvent.change(screen.getByPlaceholderText(/Darsteller/i), { target: { value: "Ada" } });
  fireEvent.click(screen.getByRole("button", { name: /Filter zurücksetzen/i }));
  expect(input).toHaveValue("");
  expect(screen.getByDisplayValue("Alle Typen")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Alle Status")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Alle Genres")).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Darsteller/i)).toHaveValue("");
});

it("debounces the search and updates all request parameters", () => {
  jest.useFakeTimers();
  render(<AdminMoviesPage />);

  fireEvent.change(screen.getByPlaceholderText(/Titel oder Beschreibung/i), { target: { value: "  Dark  " } });
  fireEvent.change(screen.getByDisplayValue("Alle Typen"), { target: { value: "Serie" } });
  fireEvent.change(screen.getByDisplayValue("Alle Status"), { target: { value: "ARCHIVED" } });
  fireEvent.change(screen.getByDisplayValue("Alle Genres"), { target: { value: "Thriller" } });
  fireEvent.change(screen.getByPlaceholderText(/Darsteller/i), { target: { value: "Ada" } });
  fireEvent.click(screen.getByRole("button", { name: "Seite zwei" }));
  fireEvent.click(screen.getByRole("button", { name: "50 pro Seite" }));
  act(() => jest.advanceTimersByTime(300));

  const requestUrl = mockedUseSWR.mock.calls.at(-1)[0] as string;
  expect(requestUrl).toContain("pageSize=50");
  expect(requestUrl).toContain("search=Dark");
  expect(requestUrl).toContain("type=Serie");
  expect(requestUrl).toContain("status=ARCHIVED");
  expect(requestUrl).toContain("genre=Thriller");
  expect(requestUrl).toContain("actor=Ada");
});

it("sorts existing and new columns", () => {
  render(<AdminMoviesPage />);

  fireEvent.click(screen.getByRole("button", { name: "Aktuelle Spalte sortieren" }));
  expect(screen.getByText("Sort: createdAt:asc")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Nach Titel sortieren" }));
  expect(screen.getByText("Sort: title:asc")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Aktuelle Spalte sortieren" }));
  expect(screen.getByText("Sort: title:desc")).toBeInTheDocument();
});

it("updates the status of selected content and refreshes the list", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
  render(<AdminMoviesPage />);

  fireEvent.click(screen.getByRole("button", { name: "Alle auswählen" }));
  expect(screen.getByText("1 ausgewählt")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Veröffentlichen" }));

  await waitFor(() => expect(screen.getByText("1 Inhalte wurden aktualisiert.")).toBeInTheDocument());
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/movies/admin", expect.objectContaining({
    method: "PATCH",
    body: JSON.stringify({ ids: ["m1"], status: "PUBLISHED" }),
  }));
  expect(mutate).toHaveBeenCalled();
  expect(screen.queryByText("1 ausgewählt")).not.toBeInTheDocument();
});

it("reports a failed bulk status update", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: false } as Response);
  render(<AdminMoviesPage />);

  fireEvent.click(screen.getByRole("button", { name: "Alle auswählen" }));
  fireEvent.click(screen.getByRole("button", { name: "Archivieren" }));

  expect(await screen.findByText("Der Status konnte nicht geändert werden.")).toBeInTheDocument();
  expect(mutate).not.toHaveBeenCalled();
});

it("exports the current table as CSV", () => {
  const createObjectURL = jest.fn(() => "blob:movies");
  const revokeObjectURL = jest.fn();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  render(<AdminMoviesPage />);

  fireEvent.click(screen.getByRole("button", { name: "CSV" }));

  expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  expect(click).toHaveBeenCalled();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:movies");
  click.mockRestore();
});

it("renders loading, error and empty catalog states", () => {
  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: undefined, isLoading: true, mutate });
  const { rerender } = render(<AdminMoviesPage />);
  expect(screen.getByLabelText("Inhalte werden geladen")).toBeInTheDocument();

  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: new Error("Katalog offline"), isLoading: false, mutate });
  rerender(<AdminMoviesPage />);
  expect(screen.getByRole("alert")).toHaveTextContent("Katalog offline");

  mockedUseSWR.mockReturnValueOnce({
    data: { movies: [], total: 0, totalPages: 0, filters: { genres: [] } },
    error: undefined,
    isLoading: false,
    mutate,
  });
  rerender(<AdminMoviesPage />);
  expect(screen.getByText("Table items: 0")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "CSV" })).toBeDisabled();
});

it("validates catalog API responses", async () => {
  render(<AdminMoviesPage />);
  const fetchCatalog = mockedUseSWR.mock.calls[0][1];
  const jsonHeaders = new Headers({ "content-type": "application/json" });
  globalThis.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, status: 200, headers: jsonHeaders, json: async () => catalogData } as Response)
    .mockResolvedValueOnce({ ok: false, status: 403, headers: jsonHeaders, json: async () => ({ error: "Nicht erlaubt" }) } as Response);

  await expect(fetchCatalog("/api/movies/admin")).resolves.toEqual(catalogData);
  await expect(fetchCatalog("/api/movies/admin")).rejects.toThrow("Nicht erlaubt");
});
