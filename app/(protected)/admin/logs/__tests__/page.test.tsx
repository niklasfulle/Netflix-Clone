import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import useSWR from "swr";
import AdminLogsPage from "../page";

jest.mock("swr");

const log = { timestamp: "2026-07-26T12:00:00.000Z", level: "warn", action: "upload_slow", userId: "u1", duration: 42 };
const mutate = jest.fn();
const mockedUseSWR = useSWR as jest.Mock;
const logsData = {
  logs: [log],
  total: 1,
  totalPages: 1,
  counts: { info: 0, warn: 1, error: 0 },
};

beforeEach(() => {
  mockedUseSWR.mockReset();
  mutate.mockReset();
  mockedUseSWR.mockReturnValue({
    data: logsData,
    error: undefined,
    isLoading: false,
    mutate,
    isValidating: false,
  });
});

afterEach(() => {
  jest.useRealTimers();
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

it("uses the logger's warn level and opens structured details", () => {
  render(<AdminLogsPage />);
  expect(screen.getAllByText(/WARN/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Anzeigen" }));
  expect(screen.getByRole("dialog", { name: "Log-Details" })).toBeInTheDocument();
  expect(screen.getAllByText(/upload_slow/).length).toBeGreaterThan(0);
});

it("requires typed confirmation before clearing logs", () => {
  render(<AdminLogsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Logs leeren/i }));
  const confirmButton = screen.getByRole("button", { name: /Endgültig leeren/i });
  expect(confirmButton).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/Gib LOGS LÖSCHEN ein/i), { target: { value: "LOGS LÖSCHEN" } });
  expect(confirmButton).toBeEnabled();
});

it("closes structured log details", () => {
  render(<AdminLogsPage />);
  fireEvent.click(screen.getByRole("button", { name: "Anzeigen" }));
  fireEvent.click(screen.getByRole("button", { name: "Details schließen" }));
  expect(screen.queryByRole("dialog", { name: "Log-Details" })).not.toBeInTheDocument();
});

it("closes structured log details with Escape and restores focus", () => {
  render(<AdminLogsPage />);
  const trigger = screen.getByRole("button", { name: "Anzeigen" });
  trigger.focus();
  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: "Escape" });

  expect(screen.queryByRole("dialog", { name: "Log-Details" })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("copies log JSON and resets the copied state", async () => {
  jest.useFakeTimers();
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(<AdminLogsPage />);
  fireEvent.click(screen.getByRole("button", { name: "Anzeigen" }));
  fireEvent.click(screen.getByRole("button", { name: "JSON kopieren" }));

  await act(async () => {
    await Promise.resolve();
  });
  expect(writeText).toHaveBeenCalledWith(JSON.stringify(log, null, 2));
  expect(screen.getByRole("button", { name: "Kopiert" })).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1500));
  expect(screen.getByRole("button", { name: "JSON kopieren" })).toBeInTheDocument();
});

it("clears logs after exact confirmation", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
  render(<AdminLogsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Logs leeren/i }));
  fireEvent.change(screen.getByLabelText(/Gib LOGS LÖSCHEN ein/i), { target: { value: "LOGS LÖSCHEN" } });
  fireEvent.click(screen.getByRole("button", { name: "Endgültig leeren" }));

  await waitFor(() => expect(screen.getByText("System-Logs wurden geleert.")).toBeInTheDocument());
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/logs/clear", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ confirmation: "LOGS LÖSCHEN" }),
  }));
  expect(mutate).toHaveBeenCalled();
  expect(screen.queryByRole("dialog", { name: "Logs endgültig leeren" })).not.toBeInTheDocument();
});

it("reports a failed clear operation and supports cancellation", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Logs konnten nicht geleert werden" }),
  } as Response);
  render(<AdminLogsPage />);
  fireEvent.click(screen.getByRole("button", { name: /Logs leeren/i }));
  fireEvent.change(screen.getByLabelText(/Gib LOGS LÖSCHEN ein/i), { target: { value: "LOGS LÖSCHEN" } });
  fireEvent.click(screen.getByRole("button", { name: "Endgültig leeren" }));
  expect(await screen.findByText("Logs konnten nicht geleert werden")).toBeInTheDocument();
  expect(mutate).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
  expect(screen.queryByRole("dialog", { name: "Logs endgültig leeren" })).not.toBeInTheDocument();
});

it("updates filters, level chips and auto-refresh options", () => {
  jest.useFakeTimers();
  render(<AdminLogsPage />);

  expect(screen.getByRole("combobox", { name: "Nach Log-Level filtern" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Nach Aktion filtern" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Nach Benutzer-ID filtern" })).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText(/Volltextsuche/i), { target: { value: "  upload  " } });
  fireEvent.click(screen.getByRole("button", { name: /ERROR · 0/i }));
  fireEvent.change(screen.getByPlaceholderText(/Aktion/i), { target: { value: "upload_slow" } });
  fireEvent.change(screen.getByPlaceholderText(/Benutzer-ID/i), { target: { value: "u1" } });
  fireEvent.change(screen.getByLabelText("Von Datum"), { target: { value: "2026-07-01" } });
  fireEvent.change(screen.getByLabelText("Bis Datum"), { target: { value: "2026-07-31" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Auto-Refresh" }));
  act(() => jest.advanceTimersByTime(300));

  const [requestUrl, , options] = mockedUseSWR.mock.calls.at(-1);
  expect(requestUrl).toContain("search=upload");
  expect(requestUrl).toContain("level=error");
  expect(requestUrl).toContain("action=upload_slow");
  expect(requestUrl).toContain("userId=u1");
  expect(requestUrl).toContain("from=2026-07-01");
  expect(requestUrl).toContain("to=2026-07-31");
  expect(options.refreshInterval).toBe(10_000);
  expect(screen.getByText("Aktualisierung alle 10 Sekunden")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "CSV" })).toHaveAttribute("href", expect.stringContaining("format=csv"));
});

it("resets every log filter", () => {
  render(<AdminLogsPage />);
  const search = screen.getByPlaceholderText(/Volltextsuche/i);
  fireEvent.change(search, { target: { value: "upload" } });
  fireEvent.change(screen.getByDisplayValue("Alle Level"), { target: { value: "warn" } });
  fireEvent.change(screen.getByPlaceholderText(/Aktion/i), { target: { value: "action" } });
  fireEvent.change(screen.getByPlaceholderText(/Benutzer-ID/i), { target: { value: "user" } });
  fireEvent.change(screen.getByLabelText("Von Datum"), { target: { value: "2026-07-01" } });
  fireEvent.change(screen.getByLabelText("Bis Datum"), { target: { value: "2026-07-31" } });
  fireEvent.click(screen.getByRole("button", { name: "Filter zurücksetzen" }));

  expect(search).toHaveValue("");
  expect(screen.getByDisplayValue("Alle Level")).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Aktion/i)).toHaveValue("");
  expect(screen.getByPlaceholderText(/Benutzer-ID/i)).toHaveValue("");
  expect(screen.getByLabelText("Von Datum")).toHaveValue("");
  expect(screen.getByLabelText("Bis Datum")).toHaveValue("");
});

it("renders warning, unknown and missing log fields", () => {
  mockedUseSWR.mockReturnValue({
    data: {
      ...logsData,
      logs: [
        { timestamp: "2026-07-26T12:00:00.000Z", level: "warning", action: "legacy_warning" },
        { timestamp: undefined, level: undefined, action: undefined, userId: undefined },
      ],
    },
    error: undefined,
    isLoading: false,
    mutate,
    isValidating: true,
  });
  render(<AdminLogsPage />);
  expect(screen.getByText("legacy_warning")).toBeInTheDocument();
  expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  expect(screen.getAllByText("–").length).toBeGreaterThanOrEqual(3);
  expect(screen.getByText("Manuelle Aktualisierung").querySelector("svg")).toHaveClass("animate-spin");
});

it("renders loading, API error and empty log states", () => {
  mockedUseSWR.mockReturnValueOnce({
    data: undefined,
    error: undefined,
    isLoading: true,
    mutate,
    isValidating: false,
  });
  const { rerender } = render(<AdminLogsPage />);
  expect(screen.getByLabelText("Logs werden geladen")).toBeInTheDocument();

  mockedUseSWR.mockReturnValueOnce({
    data: undefined,
    error: new Error("Logs offline"),
    isLoading: false,
    mutate,
    isValidating: false,
  });
  rerender(<AdminLogsPage />);
  expect(screen.getByRole("alert")).toHaveTextContent("Logs offline");

  mockedUseSWR.mockReturnValueOnce({
    data: { logs: [], total: 0, totalPages: 0, counts: { info: 0, warn: 0, error: 0 } },
    error: undefined,
    isLoading: false,
    mutate,
    isValidating: false,
  });
  rerender(<AdminLogsPage />);
  expect(screen.getByText("Keine Logs für diese Filter gefunden.")).toBeInTheDocument();
});

it("validates log API responses", async () => {
  render(<AdminLogsPage />);
  const fetchLogs = mockedUseSWR.mock.calls[0][1];
  globalThis.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => logsData } as Response)
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Logs nicht lesbar" }) } as Response);

  await expect(fetchLogs("/api/logs")).resolves.toEqual(logsData);
  await expect(fetchLogs("/api/logs")).rejects.toThrow("Logs nicht lesbar");
});
