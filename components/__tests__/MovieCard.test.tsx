import { fireEvent, render, screen } from "@testing-library/react";
import MovieCard from "@/components/MovieCard";

const push = jest.fn();
const openModal = jest.fn();

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill: _fill, priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/hooks/useInfoModal", () => ({
  __esModule: true,
  default: () => ({ openModal }),
}));

jest.mock("@/components/MovieCardPlayButton", () => ({
  __esModule: true,
  default: () => <div data-testid="play-button" />,
}));

jest.mock("@/components/FavoriteButton", () => ({
  __esModule: true,
  default: () => <div data-testid="favorite-button" />,
}));

jest.mock("@/components/RestartButton", () => ({
  __esModule: true,
  default: () => <div data-testid="restart-button" />,
}));

const movie = {
  id: "movie-1",
  title: "Test Movie",
  description: "A useful description",
  thumbnailUrl: "/thumbnail.jpg",
  genre: "Drama",
  duration: "120 min",
  progress: 42,
  actors: [{ id: "actor-1", name: "Actor One" }],
};

describe("MovieCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a semantic card with a labelled details control", () => {
    const { container } = render(<MovieCard data={movie} />);

    expect(container.querySelector("article")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Show details for Test Movie" })).toHaveLength(2);
    expect(container.querySelector("button button, button a")).not.toBeInTheDocument();
  });

  it("opens the information dialog from the primary card control", () => {
    render(<MovieCard data={movie} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Show details for Test Movie" })[0]);

    expect(openModal).toHaveBeenCalledWith("movie-1");
  });

  it("opens the information dialog from the dedicated info button", () => {
    render(<MovieCard data={movie} />);

    fireEvent.click(screen.getByRole("button", { name: "More information about Test Movie" }));

    expect(openModal).toHaveBeenCalledWith("movie-1");
  });

  it("renders responsive, non-priority card images", () => {
    render(<MovieCard data={movie} />);

    const images = screen.getAllByRole("img", { hidden: true });
    expect(images.length).toBeGreaterThan(0);
    images.forEach((image) => {
      expect(image).toHaveAttribute("sizes");
      expect(image).not.toHaveAttribute("priority");
    });
  });

  it("loads the primary thumbnail eagerly when the card is above the fold", () => {
    const { container } = render(<MovieCard data={movie} eager />);

    const images = container.querySelectorAll("img");
    expect(images[0]).toHaveAttribute("loading", "eager");
    expect(images[1]).toHaveAttribute("loading", "lazy");
  });

  it("navigates to an actor without opening the movie dialog", () => {
    render(<MovieCard data={movie} />);

    fireEvent.click(screen.getByRole("link", { name: "Actor One" }));

    expect(push).toHaveBeenCalledWith("/search/Actor One");
    expect(openModal).not.toHaveBeenCalled();
  });

});
