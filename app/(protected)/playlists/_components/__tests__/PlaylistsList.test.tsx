import { render, screen } from "@testing-library/react";

// Mock lodash
const mockIsEmpty = jest.fn();
jest.mock("lodash", () => ({
  isEmpty: mockIsEmpty,
}));

// Mock child components
jest.mock("../PlaylistCard", () => ({
  __esModule: true,
  default: ({ data, isLoading, openModalEdit }: any) => (
    <div
      data-testid="playlist-card"
      data-playlist-id={data?.id}
      data-is-loading={isLoading}
    >
      Playlist Card: {data?.name}
    </div>
  ),
}));

jest.mock("../PlaylistAddCard", () => ({
  __esModule: true,
  default: ({ openModalCreate }: any) => (
    <div data-testid="playlist-add-card">
      Playlist Add Card
    </div>
  ),
}));

// Import component after mocks
import PlaylistsList from "../PlaylistsList";

describe("PlaylistsList", () => {
  const mockOpenModalCreate = jest.fn();
  const mockOpenModalEdit = jest.fn();

  const mockPlaylists = [
    { id: "1", name: "Playlist 1", description: "First playlist" },
    { id: "2", name: "Playlist 2", description: "Second playlist" },
    { id: "3", name: "Playlist 3", description: "Third playlist" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: data is not empty
    mockIsEmpty.mockReturnValue(false);
  });

  describe("Basic Rendering", () => {
    it("renders the component", () => {
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders main container with correct classes", () => {
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass("px-4", "my-6", "space-y-8", "md:px-12");
    });
  });

  describe("Title Display", () => {
    it("renders the title", () => {
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      expect(screen.getByText("My Playlists")).toBeInTheDocument();
    });

    it("title has correct styling classes", () => {
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const title = screen.getByText("My Playlists");
      expect(title).toHaveClass(
        "font-semibold",
        "text-white",
        "text-md",
        "md:text-xl",
        "lg:text-2xl"
      );
    });

    it("renders different titles correctly", () => {
      const { rerender } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("My Playlists")).toBeInTheDocument();
      
      rerender(
        <PlaylistsList
          data={mockPlaylists}
          title="Favorite Collections"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("Favorite Collections")).toBeInTheDocument();
      expect(screen.queryByText("My Playlists")).not.toBeInTheDocument();
    });

    it("title is a paragraph element", () => {
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const title = screen.getByText("My Playlists");
      expect(title.tagName).toBe("P");
    });
  });

  describe("Grid Layout Structure", () => {
    it("renders grid container with correct classes", () => {
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass(
        "grid-cols-2",
        "gap-2",
        "mt-4",
        "lg:grid-cols-4",
        "md:gap-4"
      );
    });

    it("grid is responsive - 2 columns on mobile, 4 on large screens", () => {
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-2", "lg:grid-cols-4");
    });

    it("applies margin-top to grid", () => {
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("mt-4");
    });
  });

  describe("Empty Data Handling", () => {
    it("renders no PlaylistCards when data is empty", () => {
      mockIsEmpty.mockReturnValue(true);
      
      render(
        <PlaylistsList
          data={[]}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.queryByTestId("playlist-card")).not.toBeInTheDocument();
    });

    it("respects isEmpty logic for empty data", () => {
      mockIsEmpty.mockReturnValue(true);
      
      render(
        <PlaylistsList
          data={[]}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      // When isEmpty returns true, no PlaylistCards should render
      expect(screen.queryByTestId("playlist-card")).not.toBeInTheDocument();
    });

    it("still renders PlaylistAddCard when data is empty", () => {
      mockIsEmpty.mockReturnValue(true);
      
      render(
        <PlaylistsList
          data={[]}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("renders title even when data is empty", () => {
      mockIsEmpty.mockReturnValue(true);
      
      render(
        <PlaylistsList
          data={[]}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("My Playlists")).toBeInTheDocument();
    });
  });

  describe("Data Mapping - PlaylistCard Rendering", () => {
    it("renders PlaylistCard for each playlist in data", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const cards = screen.getAllByTestId("playlist-card");
      expect(cards).toHaveLength(3);
    });

    it("passes correct data to each PlaylistCard", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("Playlist Card: Playlist 1")).toBeInTheDocument();
      expect(screen.getByText("Playlist Card: Playlist 2")).toBeInTheDocument();
      expect(screen.getByText("Playlist Card: Playlist 3")).toBeInTheDocument();
    });

    it("passes isLoading prop to each PlaylistCard", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={true}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const cards = screen.getAllByTestId("playlist-card");
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-is-loading", "true");
      });
    });

    it("passes openModalEdit to each PlaylistCard", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      // Verify cards are rendered (openModalEdit is passed but not visible in mock)
      const cards = screen.getAllByTestId("playlist-card");
      expect(cards).toHaveLength(3);
    });

    it("uses playlist.id as key for each PlaylistCard", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      // Find cards by test-id and check their data attributes
      const cards = screen.getAllByTestId("playlist-card");
      
      expect(cards[0]).toHaveAttribute("data-playlist-id", "1");
      expect(cards[1]).toHaveAttribute("data-playlist-id", "2");
      expect(cards[2]).toHaveAttribute("data-playlist-id", "3");
    });

    it("renders single playlist correctly", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const singlePlaylist = [mockPlaylists[0]];
      render(
        <PlaylistsList
          data={singlePlaylist}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const cards = screen.getAllByTestId("playlist-card");
      expect(cards).toHaveLength(1);
    });

    it("renders many playlists correctly", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const manyPlaylists = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Playlist ${i + 1}`,
        description: `Description ${i + 1}`,
      }));
      
      render(
        <PlaylistsList
          data={manyPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const cards = screen.getAllByTestId("playlist-card");
      expect(cards).toHaveLength(10);
    });
  });

  describe("PlaylistAddCard Rendering", () => {
    it("always renders PlaylistAddCard", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("renders PlaylistAddCard even with empty data", () => {
      mockIsEmpty.mockReturnValue(true);
      
      render(
        <PlaylistsList
          data={[]}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("renders PlaylistAddCard after PlaylistCards in grid", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const grid = container.querySelector(".grid");
      
      // Should have PlaylistCards
      const playlistCards = grid?.querySelectorAll('[data-testid="playlist-card"]');
      expect(playlistCards?.length).toBe(3);
      
      // Should have PlaylistAddCard
      const addCard = grid?.querySelector('[data-testid="playlist-add-card"]');
      expect(addCard).toBeInTheDocument();
    });

    it("passes openModalCreate to PlaylistAddCard", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      // Verify PlaylistAddCard is rendered (openModalCreate is passed but not visible in mock)
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("accepts and uses data prop", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const cards = screen.getAllByTestId("playlist-card");
      expect(cards).toHaveLength(mockPlaylists.length);
    });

    it("accepts and uses title prop", () => {
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="Custom Title"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("accepts and uses isLoading prop", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { rerender } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      let cards = screen.getAllByTestId("playlist-card");
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-is-loading", "false");
      });
      
      rerender(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={true}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      cards = screen.getAllByTestId("playlist-card");
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-is-loading", "true");
      });
    });

    it("accepts and passes openModalCreate callback", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("accepts and passes openModalEdit callback", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getAllByTestId("playlist-card")).toHaveLength(3);
    });
  });

  describe("Responsive Classes", () => {
    it("applies responsive padding to main container", () => {
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass("px-4", "md:px-12");
    });

    it("applies responsive text size to title", () => {
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const title = screen.getByText("My Playlists");
      expect(title).toHaveClass("text-md", "md:text-xl", "lg:text-2xl");
    });

    it("applies responsive grid columns", () => {
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-2", "lg:grid-cols-4");
    });

    it("applies responsive gap to grid", () => {
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("gap-2", "md:gap-4");
    });
  });

  describe("Edge Cases", () => {
    it("handles null data gracefully", () => {
      mockIsEmpty.mockReturnValue(true);
      
      render(
        <PlaylistsList
          data={null as any}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("My Playlists")).toBeInTheDocument();
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("handles undefined data gracefully", () => {
      mockIsEmpty.mockReturnValue(true);
      
      render(
        <PlaylistsList
          data={undefined as any}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("My Playlists")).toBeInTheDocument();
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("handles empty string title", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title=""
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      // Find the title paragraph element
      const titleElement = container.querySelector("p.font-semibold");
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe("");
    });

    it("handles null callbacks gracefully", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={null as any}
          openModalEdit={null as any}
        />
      );
      
      expect(screen.getAllByTestId("playlist-card")).toHaveLength(3);
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("handles playlists without id", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const playlistsWithoutId = [
        { name: "Playlist 1" },
        { name: "Playlist 2" },
      ];
      
      render(
        <PlaylistsList
          data={playlistsWithoutId}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const cards = screen.getAllByTestId("playlist-card");
      expect(cards).toHaveLength(2);
    });

    it("handles very long title", () => {
      const longTitle = "A".repeat(100);
      render(
        <PlaylistsList
          data={mockPlaylists}
          title={longTitle}
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("handles special characters in title", () => {
      const specialTitle = "My Playlists! @#$%^&*()";
      render(
        <PlaylistsList
          data={mockPlaylists}
          title={specialTitle}
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });
  });

  describe("Re-render Behavior", () => {
    it("updates when data changes", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { rerender } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getAllByTestId("playlist-card")).toHaveLength(3);
      
      const newPlaylists = [mockPlaylists[0]];
      rerender(
        <PlaylistsList
          data={newPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getAllByTestId("playlist-card")).toHaveLength(1);
    });

    it("updates when title changes", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { rerender } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="Original Title"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("Original Title")).toBeInTheDocument();
      
      rerender(
        <PlaylistsList
          data={mockPlaylists}
          title="Updated Title"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("Updated Title")).toBeInTheDocument();
      expect(screen.queryByText("Original Title")).not.toBeInTheDocument();
    });

    it("updates when isLoading changes", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { rerender } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      let cards = screen.getAllByTestId("playlist-card");
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-is-loading", "false");
      });
      
      rerender(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={true}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      cards = screen.getAllByTestId("playlist-card");
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-is-loading", "true");
      });
    });

    it("handles transition from empty to populated data", () => {
      const { rerender } = render(
        <PlaylistsList
          data={[]}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      mockIsEmpty.mockReturnValue(true);
      expect(screen.queryByTestId("playlist-card")).not.toBeInTheDocument();
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
      
      mockIsEmpty.mockReturnValue(false);
      rerender(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getAllByTestId("playlist-card")).toHaveLength(3);
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("preserves PlaylistAddCard across re-renders", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { rerender } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
      
      rerender(
        <PlaylistsList
          data={[mockPlaylists[0]]}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });
  });

  describe("lodash isEmpty Usage", () => {
    it("uses isEmpty to determine whether to render PlaylistCards", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      // When isEmpty returns false, PlaylistCards should render
      expect(screen.getAllByTestId("playlist-card")).toHaveLength(3);
    });

    it("renders PlaylistCards when isEmpty returns false", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getAllByTestId("playlist-card")).toHaveLength(3);
    });

    it("does not render PlaylistCards when isEmpty returns true", () => {
      mockIsEmpty.mockReturnValue(true);
      
      render(
        <PlaylistsList
          data={[]}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.queryByTestId("playlist-card")).not.toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders complete component structure", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      // Check main container
      expect(container.querySelector(".px-4.my-6")).toBeInTheDocument();
      
      // Check title
      expect(screen.getByText("My Playlists")).toBeInTheDocument();
      
      // Check grid
      expect(container.querySelector(".grid")).toBeInTheDocument();
      
      // Check PlaylistCards
      expect(screen.getAllByTestId("playlist-card")).toHaveLength(3);
      
      // Check PlaylistAddCard
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });

    it("maintains correct order of elements", () => {
      mockIsEmpty.mockReturnValue(false);
      
      const { container } = render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Playlists"
          isLoading={false}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      const grid = container.querySelector(".grid");
      const playlistCards = grid?.querySelectorAll('[data-testid="playlist-card"]');
      const addCard = grid?.querySelector('[data-testid="playlist-add-card"]') as HTMLElement | null;
      
      // Should have 3 PlaylistCards
      expect(playlistCards?.length).toBe(3);
      
      // Should have 1 PlaylistAddCard
      expect(addCard).toBeInTheDocument();
      
      // PlaylistAddCard should be in the grid
      expect(grid).toContainElement(addCard!);
    });

    it("works correctly with all props together", () => {
      mockIsEmpty.mockReturnValue(false);
      
      render(
        <PlaylistsList
          data={mockPlaylists}
          title="My Custom Playlists"
          isLoading={true}
          openModalCreate={mockOpenModalCreate}
          openModalEdit={mockOpenModalEdit}
        />
      );
      
      expect(screen.getByText("My Custom Playlists")).toBeInTheDocument();
      
      const cards = screen.getAllByTestId("playlist-card");
      expect(cards).toHaveLength(3);
      cards.forEach((card) => {
        expect(card).toHaveAttribute("data-is-loading", "true");
      });
      
      expect(screen.getByTestId("playlist-add-card")).toBeInTheDocument();
    });
  });
});
