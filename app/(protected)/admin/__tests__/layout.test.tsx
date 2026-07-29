import { render, screen } from "@testing-library/react";
import AdminLayout from "../layout";

jest.mock("@/components/AdminNav", () => () => <nav>Admin navigation</nav>);
jest.mock("@/lib/genres", () => ({
  getSelectableGenres: () => ["Action", "Drama"],
}));
jest.mock("@/components/providers/GenreProvider", () => ({
  GenreProvider: ({
    children,
    genres,
  }: {
    children: React.ReactNode;
    genres: readonly string[];
  }) => <section data-genres={genres.join(",")}>{children}</section>,
}));

it("renders the admin navigation and page content", () => {
  render(<AdminLayout><p>Dashboard content</p></AdminLayout>);
  expect(screen.getByText("Admin navigation")).toBeInTheDocument();
  expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  expect(screen.getByText("Dashboard content").closest("section")).toHaveAttribute(
    "data-genres",
    "Action,Drama",
  );
});
