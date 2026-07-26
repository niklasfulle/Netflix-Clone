import { render, screen } from "@testing-library/react";

import AdminCreateMoviePage, { metadata } from "../page";

jest.mock("next/link", () => ({ children, href, ...props }: any) => (
  <a href={href} {...props}>{children}</a>
));

jest.mock("@/app/(protected)/add/_components/add-movie-form", () => ({
    AddMovieForm: () => <form aria-label="Add Movie" />,
}));

describe("Admin create content page", () => {
  it("renders the movie form inside the admin workflow", () => {
    render(<AdminCreateMoviePage />);

    expect(screen.getByRole("heading", { name: "Add New Content" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Add Movie" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Creation Guidance" })).toBeInTheDocument();
  });

  it("links back to content management", () => {
    render(<AdminCreateMoviePage />);

    expect(screen.getByRole("link", { name: /Back to Content Management/i })).toHaveAttribute(
      "href",
      "/admin/movies",
    );
  });

  it("exposes specific admin metadata", () => {
    expect(metadata.title).toBe("Netflix Admin - Neuer Inhalt");
    expect(metadata.description).toMatch(/Film oder eine neue Serie/i);
  });
});
