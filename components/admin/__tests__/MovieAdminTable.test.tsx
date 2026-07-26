import { fireEvent, render, screen } from "@testing-library/react";

import MovieAdminTable, { type AdminMovie } from "../MovieAdminTable";

jest.mock("next/image", () => (props: any) => <img {...props} alt={props.alt || ""} />);
jest.mock("next/link", () => ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>);

const movie: AdminMovie = {
  id: "movie-1",
  title: "Dark Horizon",
  type: "Movie",
  genre: "Drama",
  status: "PUBLISHED",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  views: 42,
  thumbnailUrl: "/thumb.jpg",
  actors: [{ actor: { name: "Ada Actor" } }],
};

const baseProps = {
  items: [movie],
  selected: [] as string[],
  onSelectionChange: jest.fn(),
  onSort: jest.fn(),
  sort: "createdAt",
  direction: "desc" as const,
};

describe("MovieAdminTable", () => {
  it("renders metadata, status and actions", () => {
    render(<MovieAdminTable {...baseProps} />);
    expect(screen.getByText("Dark Horizon")).toBeInTheDocument();
    expect(screen.getByText("Drama")).toBeInTheDocument();
    expect(screen.getByText("Veröffentlicht")).toBeInTheDocument();
    expect(screen.getByText("Ada Actor")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /bearbeiten/i })).toHaveAttribute("href", "/edit_movie/movie-1");
  });

  it("selects an item and delegates sorting", () => {
    render(<MovieAdminTable {...baseProps} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Dark Horizon auswählen/i }));
    expect(baseProps.onSelectionChange).toHaveBeenCalledWith(["movie-1"]);
    fireEvent.click(screen.getByRole("button", { name: "Inhalt" }));
    expect(baseProps.onSort).toHaveBeenCalledWith("title");
  });

  it("renders an empty state", () => {
    render(<MovieAdminTable {...baseProps} items={[]} />);
    expect(screen.getByText(/Keine Inhalte/i)).toBeInTheDocument();
  });
});
