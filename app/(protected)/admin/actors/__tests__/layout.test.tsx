import { render, screen } from "@testing-library/react";
import AdminLayout from "../../layout";

jest.mock("@/components/AdminNav", () => () => <nav>Admin navigation</nav>);

it("uses the shared responsive admin shell for actor management", () => {
  const { container } = render(<AdminLayout><p>Actor management</p></AdminLayout>);
  expect(screen.getByText("Admin navigation")).toBeInTheDocument();
  expect(screen.getByText("Actor management")).toBeInTheDocument();
  expect(container.querySelector("main")).toHaveClass("max-w-[1600px]");
});
