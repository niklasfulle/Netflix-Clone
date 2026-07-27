import { render, screen } from "@testing-library/react";
import { useParams } from "next/navigation";

import useMovie from "@/hooks/movies/useMovie";
import AdminEditMoviePage from "../page";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

jest.mock("next/link", () => ({ children, href, ...props }: any) => (
  <a href={href} {...props}>{children}</a>
));

jest.mock("@/hooks/movies/useMovie");

jest.mock("@/app/(protected)/edit_movie/[movieId]/_components/edit-movie-form", () => ({
  EditMovieForm: ({ movie }: { movie: { title: string } }) => (
    <form aria-label={`Edit ${movie.title}`} />
  ),
}));

const mockedUseParams = useParams as jest.Mock;
const mockedUseMovie = useMovie as jest.Mock;

const movie = {
  id: "movie-1",
  title: "Dark",
  description: "A mystery",
  type: "Serie",
  genre: "Drama",
  duration: "00:52:00",
  videoUrl: "dark.mp4",
  thumbnailUrl: "dark.jpg",
  actorIds: [],
  status: "PUBLISHED",
};

describe("Admin edit content page", () => {
  beforeEach(() => {
    mockedUseParams.mockReturnValue({ movieId: "movie-1" });
    mockedUseMovie.mockReturnValue({ data: movie, error: undefined, isLoading: false });
  });

  it("renders the edit form inside the admin workflow", () => {
    render(<AdminEditMoviePage />);

    expect(screen.getByRole("heading", { name: "Dark bearbeiten" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Edit Dark" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Bearbeitungshinweise" })).toBeInTheDocument();
    expect(mockedUseMovie).toHaveBeenCalledWith("movie-1");
  });

  it("links back to content management and to the movie", () => {
    render(<AdminEditMoviePage />);

    expect(screen.getByRole("link", { name: /Zur Inhaltsverwaltung/i })).toHaveAttribute(
      "href",
      "/admin/movies",
    );
    expect(screen.getByRole("link", { name: /Inhalt ansehen/i })).toHaveAttribute(
      "href",
      "/watch/movie-1",
    );
  });

  it("shows a loading state while the movie is fetched", () => {
    mockedUseMovie.mockReturnValue({ data: undefined, error: undefined, isLoading: true });

    render(<AdminEditMoviePage />);

    expect(screen.getByLabelText("Inhalt wird geladen")).toBeInTheDocument();
  });

  it("shows a recoverable error state", () => {
    mockedUseMovie.mockReturnValue({ data: undefined, error: new Error("failed"), isLoading: false });

    render(<AdminEditMoviePage />);

    expect(screen.getByRole("heading", { name: "Inhalt nicht verfügbar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Zurück zur Inhaltsverwaltung/i })).toHaveAttribute(
      "href",
      "/admin/movies",
    );
  });
});
