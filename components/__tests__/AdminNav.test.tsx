import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import AdminNav from "../AdminNav";

let mockPathname = "/admin/users";

jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("next/image", () => (props: any) => <img {...props} alt={props.alt || ""} />);
jest.mock("next/link", () => ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>);
jest.mock("@/hooks/useCurrentProfil", () => () => ({ data: { name: "Admin", image: "placeholder.png" } }));
jest.mock("@/components/AccountMenu", () => ({ visible }: any) => visible ? <div>Account options</div> : null);

beforeEach(() => {
  localStorage.clear();
  mockPathname = "/admin/users";
});

it("marks the active admin area and exposes all destinations", () => {
  render(<AdminNav />);
  expect(screen.getAllByRole("link", { name: /Benutzer/i })[0]).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("link", { name: /New Content/i })[0]).toHaveAttribute("href", "/admin/movies/new");
  expect(screen.getAllByRole("link", { name: /Analytics/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("link", { name: /System/i })[0]).toHaveAttribute("href", "/admin/system");
  expect(screen.getAllByRole("link", { name: /Backups/i })[0]).toHaveAttribute("href", "/admin/backups");
  expect(screen.getAllByRole("link", { name: /System-Logs/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("group", { name: "Language" })).toHaveLength(2);
  expect(screen.getAllByRole("button", { name: "DE" })).toHaveLength(2);
  expect(screen.getAllByRole("button", { name: "EN" })).toHaveLength(2);
});

it("marks only the create destination active on the new content page", () => {
  mockPathname = "/admin/movies/new";
  render(<AdminNav />);

  expect(screen.getAllByRole("link", { name: /New Content/i })[0]).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("link", { name: "Inhalte" })[0]).not.toHaveAttribute("aria-current");
});

it("opens the mobile navigation", () => {
  mockPathname = "/admin/users";
  render(<AdminNav />);
  fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
  expect(screen.getByRole("button", { name: "Navigation schließen" })).toHaveAttribute("aria-expanded", "true");
});

it("switches the complete admin navigation between German and English", async () => {
  render(
    <LanguageProvider>
      <AdminNav />
    </LanguageProvider>,
  );

  fireEvent.click(screen.getAllByRole("button", { name: "DE" })[0]);

  await waitFor(() => {
    expect(screen.getAllByRole("link", { name: "Übersicht" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Neuer Inhalt" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Benutzer" }).length).toBeGreaterThan(0);
  });

  fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);

  await waitFor(() => {
    expect(screen.getAllByRole("link", { name: "Overview" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "New Content" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Users" }).length).toBeGreaterThan(0);
  });
});
