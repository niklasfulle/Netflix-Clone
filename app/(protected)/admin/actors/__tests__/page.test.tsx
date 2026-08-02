import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import useSWR from "swr";
import AdminActorsPage from "../page";

jest.mock("swr");
jest.mock("next/image", () => function MockImage(props: any) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt || ""} />;
});

const actor = { id: "a1", name: "Ada Actor", movieCount: 2, seriesCount: 1, views: 33, content: [] };
const orphanActor = { id: "a2", name: "Orphan Actor", movieCount: 0, seriesCount: 0, views: 0, content: [] };
const mutate = jest.fn();
const mockedUseSWR = useSWR as jest.Mock;
const originalConfirm = globalThis.confirm;
const actorsData = { actors: [actor, orphanActor], total: 2, totalPages: 1 };

beforeEach(() => {
  mockedUseSWR.mockReset();
  mutate.mockReset();
  mockedUseSWR.mockReturnValue({ data: actorsData, error: undefined, isLoading: false, mutate });
});

afterEach(() => {
  jest.useRealTimers();
  delete (globalThis as { fetch?: typeof fetch }).fetch;
  globalThis.confirm = originalConfirm;
});

it("renders actor metrics and detail drawer", () => {
  render(<AdminActorsPage />);
  expect(screen.getByText("Ada Actor")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Ada Actor anzeigen/i }));
  expect(screen.getByRole("dialog", { name: /Details zu Ada Actor/i })).toBeInTheDocument();
});

it("opens the create dialog", () => {
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Darsteller hinzufügen/i }));
  expect(screen.getByRole("dialog", { name: "Darsteller hinzufügen" })).toBeInTheDocument();
});

it("restores focus after closing the create dialog with Escape", () => {
  render(<AdminActorsPage />);
  const trigger = screen.getByRole("button", { name: /Darsteller hinzufügen/i });
  trigger.focus();
  fireEvent.click(trigger);

  expect(screen.getByRole("dialog", { name: "Darsteller hinzufügen" })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });

  expect(screen.queryByRole("dialog", { name: "Darsteller hinzufügen" })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("closes actor details from the button and backdrop", () => {
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Ada Actor anzeigen/i }));
  fireEvent.click(screen.getByRole("button", { name: "Details schließen" }));
  expect(screen.queryByRole("dialog", { name: /Details zu Ada Actor/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Ada Actor anzeigen/i }));
  fireEvent.click(screen.getByRole("button", { name: "Hintergrund schließen" }));
  expect(screen.queryByRole("dialog", { name: /Details zu Ada Actor/i })).not.toBeInTheDocument();
});

it("closes actor details with Escape and restores focus", () => {
  render(<AdminActorsPage />);
  const trigger = screen.getByRole("button", { name: /Ada Actor anzeigen/i });
  trigger.focus();
  fireEvent.click(trigger);

  expect(screen.getByRole("dialog", { name: /Details zu Ada Actor/i })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });

  expect(screen.queryByRole("dialog", { name: /Details zu Ada Actor/i })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("shows assigned content in actor details", () => {
  mockedUseSWR.mockReturnValue({
    data: {
      actors: [{
        ...actor,
        content: [{
          id: "m1",
          title: "Katalogfilm",
          type: "Movie",
          status: "PUBLISHED",
          thumbnailUrl: "/movie.jpg",
        }],
      }],
      total: 1,
      totalPages: 1,
    },
    error: undefined,
    isLoading: false,
    mutate,
  });
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Ada Actor anzeigen/i }));
  expect(screen.getByText("Katalogfilm")).toBeInTheDocument();
  expect(screen.getByAltText("Vorschaubild zu Katalogfilm")).toBeInTheDocument();
});

it("creates a new actor and refreshes the list", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Darsteller hinzufügen/i }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Neue Person" } });
  fireEvent.click(screen.getByRole("button", { name: "Darsteller anlegen" }));

  await waitFor(() => expect(screen.getByText("Darsteller wurde hinzugefügt.")).toBeInTheDocument());
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/actors", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ name: "Neue Person" }),
  }));
  expect(mutate).toHaveBeenCalled();
});

it("reports a failed actor creation", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Name ist bereits vorhanden" }),
  } as Response);
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Darsteller hinzufügen/i }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada Actor" } });
  fireEvent.click(screen.getByRole("button", { name: "Darsteller anlegen" }));

  expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent("Name ist bereits vorhanden");
  expect(mutate).not.toHaveBeenCalled();
});

it("renames an actor", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Ada Actor umbenennen/i }));
  const nameInput = screen.getByLabelText("Name");
  expect(nameInput).toHaveValue("Ada Actor");
  fireEvent.change(nameInput, { target: { value: "Ada Renamed" } });
  fireEvent.click(screen.getByRole("button", { name: "Änderung speichern" }));

  await waitFor(() => expect(screen.getByText("Darsteller wurde umbenannt.")).toBeInTheDocument());
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/actors", expect.objectContaining({
    method: "PATCH",
    body: JSON.stringify({ id: "a1", name: "Ada Renamed" }),
  }));
});

it("merges one actor into another", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Ada Actor zusammenführen/i }));
  const mergeButton = screen.getByRole("button", { name: "Zusammenführen" });
  expect(mergeButton).toBeDisabled();
  fireEvent.change(screen.getByDisplayValue(/Ziel auswählen/i), { target: { value: "a2" } });
  fireEvent.click(mergeButton);

  await waitFor(() => expect(screen.getByText(/Zuordnungen wurden zusammengeführt/i)).toBeInTheDocument());
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/actors/merge", expect.objectContaining({
    body: JSON.stringify({ sourceId: "a1", targetId: "a2" }),
  }));
  expect(mutate).toHaveBeenCalled();
});

it("reports a failed merge and closes its dialog", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Zusammenführen fehlgeschlagen" }),
  } as Response);
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Ada Actor zusammenführen/i }));
  fireEvent.change(screen.getByDisplayValue(/Ziel auswählen/i), { target: { value: "a2" } });
  fireEvent.click(screen.getByRole("button", { name: "Zusammenführen" }));

  expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent("Zusammenführen fehlgeschlagen");
  fireEvent.click(screen.getByRole("button", { name: "Dialog schließen" }));
  expect(screen.queryByRole("dialog", { name: /zusammenführen/i })).not.toBeInTheDocument();
});

it("deletes an orphan only after confirmation", async () => {
  globalThis.confirm = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
  render(<AdminActorsPage />);
  const deleteButton = screen.getByRole("button", { name: /Orphan Actor löschen/i });

  fireEvent.click(deleteButton);
  expect(globalThis.fetch).not.toHaveBeenCalled();
  fireEvent.click(deleteButton);

  expect(await screen.findByText("Darsteller wurde gelöscht.")).toBeInTheDocument();
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/actors?id=a2", { method: "DELETE" });
  expect(mutate).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /Ada Actor löschen/i })).toBeDisabled();
});

it("reports a failed actor deletion", async () => {
  globalThis.confirm = jest.fn(() => true);
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Löschen fehlgeschlagen" }),
  } as Response);
  render(<AdminActorsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Orphan Actor löschen/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Löschen fehlgeschlagen");
});

it("updates actor search and sorting parameters", () => {
  jest.useFakeTimers();
  render(<AdminActorsPage />);
  expect(screen.getByRole("combobox", { name: "Darsteller sortieren" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Sortierreihenfolge" })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText(/Darsteller suchen/i), { target: { value: "  Ada  " } });
  fireEvent.change(screen.getByDisplayValue("Nach Name"), { target: { value: "views" } });
  fireEvent.change(screen.getByDisplayValue("Aufsteigend"), { target: { value: "desc" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Ohne Inhalte" }));
  act(() => jest.advanceTimersByTime(300));

  const requestUrl = mockedUseSWR.mock.calls.at(-1)[0] as string;
  expect(requestUrl).toContain("search=Ada");
  expect(requestUrl).toContain("sort=views");
  expect(requestUrl).toContain("direction=desc");
  expect(requestUrl).toContain("orphaned=true");
});

it("renders loading, API error and empty actor states", () => {
  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: undefined, isLoading: true, mutate });
  const { rerender } = render(<AdminActorsPage />);
  expect(screen.getByLabelText("Darsteller werden geladen")).toBeInTheDocument();

  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: new Error("Darsteller offline"), isLoading: false, mutate });
  rerender(<AdminActorsPage />);
  expect(screen.getByRole("alert")).toHaveTextContent("Darsteller offline");

  mockedUseSWR.mockReturnValueOnce({
    data: { actors: [], total: 0, totalPages: 0 },
    error: undefined,
    isLoading: false,
    mutate,
  });
  rerender(<AdminActorsPage />);
  expect(screen.getByText("Keine Darsteller gefunden.")).toBeInTheDocument();
});

it("validates actor API responses", async () => {
  render(<AdminActorsPage />);
  const fetchActors = mockedUseSWR.mock.calls[0][1];
  globalThis.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => actorsData } as Response)
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Keine Berechtigung" }) } as Response);

  await expect(fetchActors("/api/actors")).resolves.toEqual(actorsData);
  await expect(fetchActors("/api/actors")).rejects.toThrow("Keine Berechtigung");
});
