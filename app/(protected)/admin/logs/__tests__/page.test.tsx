import { fireEvent, render, screen } from "@testing-library/react";
import useSWR from "swr";
import AdminLogsPage from "../page";

jest.mock("swr");

const log = { timestamp: "2026-07-26T12:00:00.000Z", level: "warn", action: "upload_slow", userId: "u1", duration: 42 };

beforeEach(() => {
  (useSWR as jest.Mock).mockReturnValue({ data: { logs: [log], total: 1, totalPages: 1, counts: { info: 0, warn: 1, error: 0 } }, error: undefined, isLoading: false, mutate: jest.fn(), isValidating: false });
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
