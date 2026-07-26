import { fireEvent, render, screen } from "@testing-library/react";
import AdminNav from "../AdminNav";

let mockPathname = "/admin/users";

jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("next/image", () => (props: any) => <img {...props} alt={props.alt || ""} />);
jest.mock("next/link", () => ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>);
jest.mock("@/hooks/useCurrentProfil", () => () => ({ data: { name: "Admin", image: "placeholder.png" } }));
jest.mock("@/components/AccountMenu", () => ({ visible }: any) => visible ? <div>Account options</div> : null);

it("marks the active admin area and exposes all destinations", () => {
  render(<AdminNav />);
  expect(screen.getAllByRole("link", { name: /Benutzer/i })[0]).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("link", { name: /New Content/i })[0]).toHaveAttribute("href", "/admin/movies/new");
  expect(screen.getAllByRole("link", { name: /Analytics/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("link", { name: /Backups/i })[0]).toHaveAttribute("href", "/admin/backups");
  expect(screen.getAllByRole("link", { name: /System-Logs/i }).length).toBeGreaterThan(0);
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
