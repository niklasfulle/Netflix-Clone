import { render, screen } from "@testing-library/react";
import AdminLayout from "../layout";

jest.mock("@/components/AdminNav", () => () => <nav>Admin navigation</nav>);

it("renders the admin navigation and page content", () => {
  render(<AdminLayout><p>Dashboard content</p></AdminLayout>);
  expect(screen.getByText("Admin navigation")).toBeInTheDocument();
  expect(screen.getByText("Dashboard content")).toBeInTheDocument();
});
