import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import AdminNav from "../AdminNav";

let mockPathname = "/admin/users";
let mockProfile: { name: string; image: string } | undefined = { name: "Admin", image: "placeholder.png" };

jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
jest.mock("@/hooks/useCurrentProfil", () => () => ({ data: mockProfile }));
jest.mock("@/components/AccountMenu", () => ({ visible }: { visible: boolean }) => (
  visible ? <div>Account options</div> : null
));

beforeEach(() => {
  localStorage.clear();
  mockPathname = "/admin/users";
  mockProfile = { name: "Admin", image: "placeholder.png" };
});

it("closes the mobile drawer after a route change and toggles account options", () => {
  mockProfile = undefined;
  const { rerender, container } = render(<AdminNav />);
  expect(container.querySelector('img[src="/images/profil/placeholder.png"]')).toBeInTheDocument();
  const account = screen.getByRole("button", { name: "Admin Account & Sign out" });
  fireEvent.click(account);
  expect(screen.getByText("Account options")).toBeInTheDocument();
  fireEvent.click(account);
  expect(screen.queryByText("Account options")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  mockPathname = "/outside-admin";
  rerender(<AdminNav />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(container.querySelector('[aria-current="page"]')).not.toBeInTheDocument();
});

it("closes mobile navigation after destination clicks and explicit close actions", () => {
  render(<AdminNav />);
  fireEvent.click(screen.getByRole("link", { name: "Users" }));
  for (const destination of ["Users", "Back to Netflix"]) {
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("link", { name: destination }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close navigation" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("marks the active admin area and exposes all destinations", () => {
  render(<AdminNav />);

  expect(screen.getAllByRole("link", { name: "Users" })[0]).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("link", { name: "New Content" })[0]).toHaveAttribute("href", "/admin/movies/new");
  expect(screen.getAllByRole("link", { name: "Analytics" }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("link", { name: "System" })[0]).toHaveAttribute("href", "/admin/system");
  expect(screen.getAllByRole("link", { name: "Backups" })[0]).toHaveAttribute("href", "/admin/backups");
  expect(screen.getAllByRole("link", { name: "System Logs" }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("link", { name: "Audit Log" })[0]).toHaveAttribute("href", "/admin/audit");
  expect(screen.getAllByRole("link", { name: "Media Health" })[0]).toHaveAttribute("href", "/admin/media-health");
  expect(screen.getAllByRole("link", { name: "Categories" })[0]).toHaveAttribute("href", "/admin/categories");
  expect(screen.queryByRole("link", { name: "Video analysis" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("group", { name: "Language" })).toHaveLength(2);
});

it("marks only the create destination active on the new content page", () => {
  mockPathname = "/admin/movies/new";
  render(<AdminNav />);

  expect(screen.getAllByRole("link", { name: "New Content" })[0]).toHaveAttribute("aria-current", "page");
  expect(screen.getAllByRole("link", { name: "Content" })[0]).not.toHaveAttribute("aria-current");
});

it("provides an accessible mobile dialog that closes with Escape and restores focus", () => {
  render(<AdminNav />);
  const openButton = screen.getByRole("button", { name: "Open navigation" });

  openButton.focus();
  fireEvent.click(openButton);

  const dialog = screen.getByRole("dialog", { name: "Admin Area" });
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(within(dialog).getByRole("button", { name: "Close navigation" })).toHaveFocus();

  fireEvent.keyDown(dialog, { key: "Escape" });

  expect(screen.queryByRole("dialog", { name: "Admin Area" })).not.toBeInTheDocument();
  expect(openButton).toHaveFocus();
});

it("lets mobile administrators return to the regular browse area", () => {
  render(<AdminNav />);
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

  const dialog = screen.getByRole("dialog", { name: "Admin Area" });
  expect(within(dialog).getByRole("link", { name: "Back to Netflix" })).toHaveAttribute("href", "/");
  expect(within(dialog).getByRole("navigation", { name: "Admin Area" }).parentElement).toHaveClass(
    "min-h-0",
    "overflow-y-auto",
  );
  expect(dialog.parentElement).toHaveClass("top-16", "bottom-0");
  expect(dialog.parentElement).not.toHaveClass("inset-0", "pt-16");
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
    expect(screen.getAllByRole("link", { name: "Medienzustand" }).length).toBeGreaterThan(0);
  });

  fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);

  await waitFor(() => {
    expect(screen.getAllByRole("link", { name: "Overview" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "New Content" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Users" }).length).toBeGreaterThan(0);
  });
});
