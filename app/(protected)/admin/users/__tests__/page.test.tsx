import { fireEvent, render, screen } from "@testing-library/react";
import useSWR from "swr";
import AdminUsersPage from "../page";

jest.mock("swr");
jest.mock("@/hooks/useCurrentUser", () => () => ({ user: { id: "admin-1" } }));

const user = { id: "u1", name: "Test User", email: "test@example.com", role: "USER", isBlocked: false, isTwoFactorEnabled: true, createdAt: "2026-01-01", profiles: [{ id: "p1", name: "Profil", inUse: true, createdAt: "2026-01-01" }] };

beforeEach(() => {
  (useSWR as jest.Mock).mockReturnValue({ data: { users: [user], total: 1, totalPages: 1, counts: { active: 1, blocked: 0, admins: 1 } }, error: undefined, isLoading: false, mutate: jest.fn() });
});

it("renders security filters and user status", () => {
  render(<AdminUsersPage />);
  expect(screen.getByRole("heading", { name: "Benutzer" })).toBeInTheDocument();
  expect(screen.getByText("test@example.com")).toBeInTheDocument();
  expect(screen.getByText("2FA beliebig")).toBeInTheDocument();
});

it("opens user details and block dialog", () => {
  render(<AdminUsersPage />);
  fireEvent.click(screen.getByRole("button", { name: /Test User anzeigen/i }));
  expect(screen.getByRole("dialog", { name: /Benutzerdetails Test User/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Details schließen/i }));
  fireEvent.click(screen.getByRole("button", { name: /Test User sperren/i }));
  expect(screen.getByRole("dialog", { name: "Benutzer sperren" })).toBeInTheDocument();
});
