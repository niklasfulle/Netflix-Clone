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
jest.mock("@/components/MovieList", () => ({ title, data }: { title: string; data: { id?: string }[] }) => <div data-testid="new-items" data-count={data.length} data-ids={data.map(item => item.id).join(',')}>{title}</div>);
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
  it('renders an empty new-title row while the catalog request is loading', () => {
    jest.mocked(useNewSeriesList).mockReturnValue({ data: undefined, isLoading: true } as never);
    render(<SeriesPage />);
    expect(screen.getByTestId('new-items')).toHaveAttribute('data-count', '0');
  });
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

  it('waits for the first actor rows before exposing pagination', () => {
    jest.mocked(useActorPagination).mockReturnValue({
      actors: [], actorsCount: 4, error: undefined, hasMore: true, isLoading: true, loadMore,
    });
    render(<SeriesPage />);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows only the four newest series while the shared catalog can supply eight', () => {
    jest.mocked(useNewSeriesList).mockReturnValue({ data: Array.from({ length: 8 }, (_, index) => ({ id: `series-${index}`, title: `Series ${index}` })), isLoading: false } as never);
    render(<SeriesPage />);
    expect(screen.getByTestId('new-items')).toHaveAttribute('data-count', '4');
    expect(screen.getByTestId('new-items')).toHaveAttribute('data-ids', 'series-0,series-1,series-2,series-3');
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
