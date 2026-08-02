import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import useSWR from "swr";
import AdminUsersPage from "../page";

jest.mock("swr");
jest.mock("@/hooks/useCurrentUser", () => () => ({ user: { id: "admin-1" } }));

const user = { id: "u1", name: "Test User", email: "test@example.com", role: "USER", isBlocked: false, isTwoFactorEnabled: true, createdAt: "2026-01-01", profiles: [{ id: "p1", name: "Profil", inUse: true, createdAt: "2026-01-01" }] };
const mutate = jest.fn();
const mockedUseSWR = useSWR as jest.Mock;
const originalConfirm = globalThis.confirm;

const usersData = {
  users: [user],
  total: 1,
  totalPages: 1,
  counts: { active: 1, blocked: 0, admins: 1 },
};

beforeEach(() => {
  mockedUseSWR.mockReset();
  mutate.mockReset();
  mockedUseSWR.mockReturnValue({ data: usersData, error: undefined, isLoading: false, mutate });
});

afterEach(() => {
  jest.useRealTimers();
  delete (globalThis as { fetch?: typeof fetch }).fetch;
  globalThis.confirm = originalConfirm;
});

it("renders security filters and user status", () => {
  render(<AdminUsersPage />);
  expect(screen.getByRole("heading", { name: "Benutzer" })).toBeInTheDocument();
  expect(screen.getByText("test@example.com")).toBeInTheDocument();
  expect(screen.getByText("2FA beliebig")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Nach Rolle filtern" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Nach Kontostatus filtern" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Nach Zwei-Faktor-Status filtern" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Benutzer sortieren" })).toBeInTheDocument();
});

it("opens user details and block dialog", () => {
  render(<AdminUsersPage />);
  fireEvent.click(screen.getByRole("button", { name: /Test User anzeigen/i }));
  expect(screen.getByRole("dialog", { name: /Benutzerdetails Test User/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Details schließen/i }));
  fireEvent.click(screen.getByRole("button", { name: /Test User sperren/i }));
  expect(screen.getByRole("dialog", { name: "Benutzer sperren" })).toBeInTheDocument();
});

it("closes user details from the button and backdrop", () => {
  render(<AdminUsersPage />);
  fireEvent.click(screen.getByRole("button", { name: /Test User anzeigen/i }));
  fireEvent.click(screen.getByRole("button", { name: "Details schließen" }));
  expect(screen.queryByRole("dialog", { name: /Benutzerdetails/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Test User anzeigen/i }));
  fireEvent.click(screen.getByRole("button", { name: "Hintergrund schließen" }));
  expect(screen.queryByRole("dialog", { name: /Benutzerdetails/i })).not.toBeInTheDocument();
});

it("shows blocked-account details and empty profiles", () => {
  const blockedUser = {
    ...user,
    id: "u2",
    name: "Blocked User",
    isBlocked: true,
    blockedReason: "Missbrauch",
    blockedUntil: "2026-08-01T10:00:00.000Z",
    profiles: [],
  };
  mockedUseSWR.mockReturnValue({
    data: { ...usersData, users: [blockedUser], counts: { active: 0, blocked: 1, admins: 1 } },
    error: undefined,
    isLoading: false,
    mutate,
  });
  render(<AdminUsersPage />);

  fireEvent.click(screen.getByRole("button", { name: /Blocked User anzeigen/i }));
  expect(screen.getByText("Missbrauch")).toBeInTheDocument();
  expect(screen.getByText("Keine Profile vorhanden.")).toBeInTheDocument();
  expect(screen.getByText(/Bis /)).toBeInTheDocument();
});

it("blocks a user with reason and expiry", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
  render(<AdminUsersPage />);

  fireEvent.click(screen.getByRole("button", { name: /Test User sperren/i }));
  fireEvent.change(screen.getByPlaceholderText(/Grund für die Sperre/i), { target: { value: "Regelverstoß" } });
  fireEvent.change(screen.getByLabelText(/Optionales Ablaufdatum/i), { target: { value: "2026-08-02T10:30" } });
  fireEvent.click(screen.getByRole("button", { name: "Konto sperren" }));

  await waitFor(() => expect(screen.getByText("Benutzer wurde gesperrt.")).toBeInTheDocument());
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/users/block", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({
      userId: "u1",
      block: true,
      reason: "Regelverstoß",
      blockedUntil: "2026-08-02T10:30",
    }),
  }));
  expect(mutate).toHaveBeenCalled();
  expect(screen.queryByRole("dialog", { name: "Benutzer sperren" })).not.toBeInTheDocument();
});

it("reports a failed block and lets the admin close the dialog", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Sperre fehlgeschlagen" }),
  } as Response);
  render(<AdminUsersPage />);

  fireEvent.click(screen.getByRole("button", { name: /Test User sperren/i }));
  fireEvent.click(screen.getByRole("button", { name: "Konto sperren" }));
  expect(await screen.findByText("Sperre fehlgeschlagen")).toBeInTheDocument();
  expect(mutate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Dialog schließen" }));
  expect(screen.queryByRole("dialog", { name: "Benutzer sperren" })).not.toBeInTheDocument();
});

it("unblocks an existing blocked user", async () => {
  const blockedUser = { ...user, id: "u2", name: "Blocked User", isBlocked: true };
  mockedUseSWR.mockReturnValue({
    data: { ...usersData, users: [blockedUser] },
    error: undefined,
    isLoading: false,
    mutate,
  });
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
  render(<AdminUsersPage />);

  fireEvent.click(screen.getByRole("button", { name: /Blocked User entsperren/i }));

  expect(await screen.findByText("Benutzer wurde entsperrt.")).toBeInTheDocument();
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/users/block", expect.objectContaining({
    body: JSON.stringify({ userId: "u2", block: false }),
  }));
});

it("changes a role after confirmation and handles cancellation", async () => {
  globalThis.confirm = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response);
  render(<AdminUsersPage />);
  fireEvent.click(screen.getByRole("button", { name: /Test User anzeigen/i }));

  fireEvent.click(screen.getByRole("button", { name: "Administrator" }));
  expect(globalThis.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Administrator" }));

  await waitFor(() => expect(screen.getByText("Rolle wurde aktualisiert.")).toBeInTheDocument());
  expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/users", expect.objectContaining({
    method: "PATCH",
    body: JSON.stringify({ userId: "u1", role: "ADMIN" }),
  }));
  expect(mutate).toHaveBeenCalled();
});

it("reports a failed role change", async () => {
  globalThis.confirm = jest.fn(() => true);
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Rollenwechsel fehlgeschlagen" }),
  } as Response);
  render(<AdminUsersPage />);
  fireEvent.click(screen.getByRole("button", { name: /Test User anzeigen/i }));
  fireEvent.click(screen.getByRole("button", { name: "Administrator" }));

  expect(await screen.findByText("Rollenwechsel fehlgeschlagen")).toBeInTheDocument();
  expect(mutate).not.toHaveBeenCalled();
});

it("updates search and security filters in the request URL", () => {
  jest.useFakeTimers();
  render(<AdminUsersPage />);

  fireEvent.change(screen.getByPlaceholderText(/Name oder E-Mail/i), { target: { value: "  Test  " } });
  fireEvent.change(screen.getByDisplayValue("Alle Rollen"), { target: { value: "ADMIN" } });
  fireEvent.change(screen.getByDisplayValue("Alle Status"), { target: { value: "blocked" } });
  fireEvent.change(screen.getByDisplayValue("2FA beliebig"), { target: { value: "enabled" } });
  fireEvent.change(screen.getByDisplayValue("Neueste zuerst"), { target: { value: "name:desc" } });
  act(() => jest.advanceTimersByTime(300));

  const requestUrl = mockedUseSWR.mock.calls.at(-1)[0] as string;
  expect(requestUrl).toContain("search=Test");
  expect(requestUrl).toContain("role=ADMIN");
  expect(requestUrl).toContain("status=blocked");
  expect(requestUrl).toContain("twoFactor=enabled");
  expect(requestUrl).toContain("sort=name");
  expect(requestUrl).toContain("direction=desc");
});

it("exports users as CSV", () => {
  const createObjectURL = jest.fn(() => "blob:users");
  const revokeObjectURL = jest.fn();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  render(<AdminUsersPage />);

  fireEvent.click(screen.getByRole("button", { name: /CSV exportieren/i }));
  expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  expect(click).toHaveBeenCalled();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:users");
  click.mockRestore();
});

it("renders loading, error and empty user states", () => {
  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: undefined, isLoading: true, mutate });
  const { rerender } = render(<AdminUsersPage />);
  expect(screen.getByLabelText("Benutzer werden geladen")).toBeInTheDocument();

  mockedUseSWR.mockReturnValueOnce({ data: undefined, error: new Error("Benutzer offline"), isLoading: false, mutate });
  rerender(<AdminUsersPage />);
  expect(screen.getByRole("alert")).toHaveTextContent("Benutzer offline");

  mockedUseSWR.mockReturnValueOnce({
    data: { users: [], total: 0, totalPages: 0, counts: { active: 0, blocked: 0, admins: 0 } },
    error: undefined,
    isLoading: false,
    mutate,
  });
  rerender(<AdminUsersPage />);
  expect(screen.getByText("Keine Benutzer gefunden.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /CSV exportieren/i })).toBeDisabled();
});

it("validates user API responses", async () => {
  render(<AdminUsersPage />);
  const fetchUsers = mockedUseSWR.mock.calls[0][1];
  globalThis.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => usersData } as Response)
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Zugriff verweigert" }) } as Response);

  await expect(fetchUsers("/api/admin/users")).resolves.toEqual(usersData);
  await expect(fetchUsers("/api/admin/users")).rejects.toThrow("Zugriff verweigert");
});
