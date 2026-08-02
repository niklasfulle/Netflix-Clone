import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";

import SeriesPage from "../page";
import { useActorPagination } from "@/hooks/catalog/useActorPagination";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import useNewSeriesList from "@/hooks/series/useNewSeriesList";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useInfoModal from "@/hooks/useInfoModal";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/hooks/catalog/useActorPagination");
jest.mock("@/hooks/playlists/usePlaylists");
jest.mock("@/hooks/series/useNewSeriesList");
jest.mock("@/hooks/useCurrentProfil");
jest.mock("@/hooks/useInfoModal");
jest.mock("@/components/Footer", () => () => <footer>Footer</footer>);
jest.mock("@/components/Navbar", () => () => <nav>Navbar</nav>);
jest.mock("@/components/InfoModal", () => () => null);
jest.mock("@/components/MovieList", () => ({ title }: { title: string }) => <div>{title}</div>);
jest.mock("../_components/BillboardSeries", () => () => <div>Billboard</div>);
jest.mock("../_components/FilterRowSeries", () => ({
  title,
  deferLoading,
}: { title: string; deferLoading?: boolean }) => (
  <div data-testid={`actor-row-${title}`} data-deferred={String(Boolean(deferLoading))}>
    {title}
  </div>
));

describe("SeriesPage", () => {
  const push = jest.fn();
  const loadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue({ push } as never);
    jest.mocked(useNewSeriesList).mockReturnValue({ data: [], isLoading: false } as never);
    jest.mocked(usePlaylists).mockReturnValue({ data: [] } as never);
    jest.mocked(useCurrentProfil).mockReturnValue({ data: { id: "profile-1" } } as never);
    jest.mocked(useInfoModal).mockReturnValue({ isOpen: false, closeModal: jest.fn() } as never);
    jest.mocked(useActorPagination).mockReturnValue({
      actors: ["Actor 1", "Actor 2"],
      actorsCount: 4,
      error: undefined,
      hasMore: true,
      isLoading: false,
      loadMore,
    });
  });

  it("renders actor rows and loads another page", () => {
    render(<SeriesPage />);

    expect(screen.getByText("Actor 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(loadMore).toHaveBeenCalledTimes(1);
    expect(useActorPagination).toHaveBeenCalledWith("series");
  });

  it("loads only the first actor row eagerly", () => {
    render(<SeriesPage />);

    expect(screen.getByTestId("actor-row-Actor 1")).toHaveAttribute("data-deferred", "false");
    expect(screen.getByTestId("actor-row-Actor 2")).toHaveAttribute("data-deferred", "true");
  });

  it("hides pagination after all actors are loaded", () => {
    jest.mocked(useActorPagination).mockReturnValue({
      actors: [],
      actorsCount: 0,
      error: undefined,
      hasMore: false,
      isLoading: false,
      loadMore,
    });

    const { container } = render(<SeriesPage />);
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
    expect(container.querySelector(".pb-20")).toBeInTheDocument();
  });

  it("waits for a profile and redirects empty profiles", () => {
    jest.mocked(useCurrentProfil).mockReturnValueOnce({ data: undefined } as never);
    const { container, rerender } = render(<SeriesPage />);
    expect(container.firstChild).toBeNull();

    jest.mocked(useCurrentProfil).mockReturnValue({ data: {} } as never);
    rerender(<SeriesPage />);
    expect(push).toHaveBeenCalledWith("profiles");
  });
});
