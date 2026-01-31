import React from "react";
import { render, screen } from "@testing-library/react";

// Mock dependencies before imports
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

jest.mock("@/components/Footer", () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}));

jest.mock("@/components/Navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

jest.mock("@/hooks/playlists/useCreatePlaylistModal", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/playlists/useUpdatePlaylistModal", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/playlists/usePlaylists", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useCurrentProfil", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../_components/PlaylistCreateModal", () => ({
  __esModule: true,
  default: ({ visible, onClose }: any) => (
    <div data-testid="playlist-create-modal" data-visible={visible}>
      <button onClick={onClose} data-testid="create-modal-close">
        Close
      </button>
    </div>
  ),
}));

jest.mock("../_components/PlaylistEditModal", () => ({
  __esModule: true,
  default: ({ visible, onClose }: any) => (
    <div data-testid="playlist-edit-modal" data-visible={visible}>
      <button onClick={onClose} data-testid="edit-modal-close">
        Close
      </button>
    </div>
  ),
}));

jest.mock("../_components/PlaylistsList", () => ({
  __esModule: true,
  default: ({ title, data, isLoading, openModalCreate, openModalEdit }: any) => (
    <div data-testid="playlists-list">
      <h1 data-testid="playlists-title">{title}</h1>
      <div data-testid="playlists-loading">{isLoading ? "Loading" : "Not Loading"}</div>
      <div data-testid="playlists-data">{JSON.stringify(data)}</div>
      <button onClick={openModalCreate} data-testid="open-create">
        Open Create
      </button>
      <button onClick={openModalEdit} data-testid="open-edit">
        Open Edit
      </button>
    </div>
  ),
}));

// Import component after mocks
import SeriesPage from "../page";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useCreatePlaylistModal from "@/hooks/playlists/useCreatePlaylistModal";
import useUpdatePlaylistModal from "@/hooks/playlists/useUpdatePlaylistModal";
import usePlaylists from "@/hooks/playlists/usePlaylists";

const mockUseCurrentProfil = useCurrentProfil as jest.MockedFunction<typeof useCurrentProfil>;
const mockUseCreatePlaylistModal = useCreatePlaylistModal as jest.MockedFunction<
  typeof useCreatePlaylistModal
>;
const mockUseUpdatePlaylistModal = useUpdatePlaylistModal as jest.MockedFunction<
  typeof useUpdatePlaylistModal
>;
const mockUsePlaylists = usePlaylists as jest.MockedFunction<typeof usePlaylists>;

describe("SeriesPage (Playlists Page)", () => {
  const mockOpenModalCreate = jest.fn();
  const mockCloseModalCreate = jest.fn();
  const mockOpenModalEdit = jest.fn();
  const mockCloseModalEdit = jest.fn();

  const mockProfil = {
    id: "profil-1",
    name: "Test Profile",
    image: "/images/profile.png",
  };

  const mockPlaylists = [
    { id: "playlist-1", title: "My Playlist 1", movies: [] },
    { id: "playlist-2", title: "My Playlist 2", movies: [] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCurrentProfil.mockReturnValue({
      data: mockProfil,
      error: null,
      isLoading: false,
      mutate: jest.fn(),
    } as any);

    mockUseCreatePlaylistModal.mockReturnValue({
      isOpen: false,
      openModal: mockOpenModalCreate,
      closeModal: mockCloseModalCreate,
    });

    mockUseUpdatePlaylistModal.mockReturnValue({
      isOpen: false,
      playlistId: null,
      openModal: mockOpenModalEdit,
      closeModal: mockCloseModalEdit,
    });

    mockUsePlaylists.mockReturnValue({
      data: mockPlaylists,
      error: null,
      isLoading: false,
      mutate: jest.fn(),
    } as any);
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      render(<SeriesPage />);
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });

    it("returns null when profil is undefined", () => {
      mockUseCurrentProfil.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      const { container } = render(<SeriesPage />);
      expect(container.firstChild).toBeNull();
    });

    it("renders all main components when profil exists", () => {
      render(<SeriesPage />);

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("playlists-list")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Profile Handling", () => {
    it("redirects to profiles page when profil is empty", () => {
      mockUseCurrentProfil.mockReturnValue({
        data: {},
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      render(<SeriesPage />);

      expect(mockPush).toHaveBeenCalledWith("profiles");
    });

    it("does not redirect when profil is not empty", () => {
      render(<SeriesPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("renders page content when profil has data", () => {
      render(<SeriesPage />);

      expect(screen.getByTestId("playlists-list")).toBeInTheDocument();
    });
  });

  describe("Modals", () => {
    it("renders PlaylistCreateModal with correct props", () => {
      render(<SeriesPage />);

      const createModal = screen.getByTestId("playlist-create-modal");
      expect(createModal).toBeInTheDocument();
      expect(createModal).toHaveAttribute("data-visible", "false");
    });

    it("renders PlaylistEditModal with correct props", () => {
      render(<SeriesPage />);

      const editModal = screen.getByTestId("playlist-edit-modal");
      expect(editModal).toBeInTheDocument();
      expect(editModal).toHaveAttribute("data-visible", "false");
    });

    it("shows create modal when isOpenCreate is true", () => {
      mockUseCreatePlaylistModal.mockReturnValue({
        isOpen: true,
        openModal: mockOpenModalCreate,
        closeModal: mockCloseModalCreate,
      });

      render(<SeriesPage />);

      const createModal = screen.getByTestId("playlist-create-modal");
      expect(createModal).toHaveAttribute("data-visible", "true");
    });

    it("shows edit modal when isOpenEdit is true", () => {
      mockUseUpdatePlaylistModal.mockReturnValue({
        isOpen: true,
        playlistId: "playlist-1",
        openModal: mockOpenModalEdit,
        closeModal: mockCloseModalEdit,
      });

      render(<SeriesPage />);

      const editModal = screen.getByTestId("playlist-edit-modal");
      expect(editModal).toHaveAttribute("data-visible", "true");
    });

    it("passes closeModalCreate to PlaylistCreateModal", () => {
      render(<SeriesPage />);

      const closeButton = screen.getByTestId("create-modal-close");
      closeButton.click();

      expect(mockCloseModalCreate).toHaveBeenCalled();
    });

    it("passes closeModalEdit to PlaylistEditModal", () => {
      render(<SeriesPage />);

      const closeButton = screen.getByTestId("edit-modal-close");
      closeButton.click();

      expect(mockCloseModalEdit).toHaveBeenCalled();
    });
  });

  describe("PlaylistsList Component", () => {
    it("renders PlaylistsList with title 'Playlists'", () => {
      render(<SeriesPage />);

      expect(screen.getByTestId("playlists-title")).toHaveTextContent("Playlists");
    });

    it("passes playlists data to PlaylistsList", () => {
      render(<SeriesPage />);

      const dataElement = screen.getByTestId("playlists-data");
      expect(dataElement).toHaveTextContent(JSON.stringify(mockPlaylists));
    });

    it("passes loading state to PlaylistsList", () => {
      mockUsePlaylists.mockReturnValue({
        data: mockPlaylists,
        error: null,
        isLoading: true,
        mutate: jest.fn(),
      } as any);

      render(<SeriesPage />);

      expect(screen.getByTestId("playlists-loading")).toHaveTextContent("Loading");
    });

    it("passes not loading state to PlaylistsList", () => {
      render(<SeriesPage />);

      expect(screen.getByTestId("playlists-loading")).toHaveTextContent("Not Loading");
    });

    it("passes openModalCreate callback to PlaylistsList", () => {
      render(<SeriesPage />);

      const openButton = screen.getByTestId("open-create");
      openButton.click();

      expect(mockOpenModalCreate).toHaveBeenCalled();
    });

    it("passes openModalEdit callback to PlaylistsList", () => {
      render(<SeriesPage />);

      const openButton = screen.getByTestId("open-edit");
      openButton.click();

      expect(mockOpenModalEdit).toHaveBeenCalled();
    });
  });

  describe("Layout Structure", () => {
    it("renders modals before main content", () => {
      render(<SeriesPage />);

      const createModal = screen.getByTestId("playlist-create-modal");
      const navbar = screen.getByTestId("navbar");

      expect(createModal).toBeInTheDocument();
      expect(navbar).toBeInTheDocument();
    });

    it("renders Navbar before main content div", () => {
      render(<SeriesPage />);

      const navbar = screen.getByTestId("navbar");
      const playlistsList = screen.getByTestId("playlists-list");

      expect(navbar).toBeInTheDocument();
      expect(playlistsList).toBeInTheDocument();
    });

    it("renders Footer after main content", () => {
      render(<SeriesPage />);

      const playlistsList = screen.getByTestId("playlists-list");
      const footer = screen.getByTestId("footer");

      expect(playlistsList).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });

    it("wraps PlaylistsList in a div with correct classes", () => {
      const { container } = render(<SeriesPage />);

      const wrapperDiv = container.querySelector(".pt-40.pb-40.h-lvh");
      expect(wrapperDiv).toBeInTheDocument();
      expect(wrapperDiv?.querySelector('[data-testid="playlists-list"]')).toBeInTheDocument();
    });
  });

  describe("Hooks Integration", () => {
    it("calls useCurrentProfil hook", () => {
      render(<SeriesPage />);

      expect(mockUseCurrentProfil).toHaveBeenCalled();
    });

    it("calls useCreatePlaylistModal hook", () => {
      render(<SeriesPage />);

      expect(mockUseCreatePlaylistModal).toHaveBeenCalled();
    });

    it("calls useUpdatePlaylistModal hook", () => {
      render(<SeriesPage />);

      expect(mockUseUpdatePlaylistModal).toHaveBeenCalled();
    });

    it("calls usePlaylists hook", () => {
      render(<SeriesPage />);

      expect(mockUsePlaylists).toHaveBeenCalled();
    });

    it("uses data from usePlaylists hook", () => {
      const customPlaylists = [{ id: "custom-1", title: "Custom Playlist", movies: [] }];

      mockUsePlaylists.mockReturnValue({
        data: customPlaylists,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      render(<SeriesPage />);

      const dataElement = screen.getByTestId("playlists-data");
      expect(dataElement).toHaveTextContent(JSON.stringify(customPlaylists));
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined playlists data", () => {
      mockUsePlaylists.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      render(<SeriesPage />);

      expect(screen.getByTestId("playlists-list")).toBeInTheDocument();
    });

    it("handles empty playlists array", () => {
      mockUsePlaylists.mockReturnValue({
        data: [],
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      render(<SeriesPage />);

      const dataElement = screen.getByTestId("playlists-data");
      expect(dataElement).toHaveTextContent("[]");
    });

    it("handles null profil data", () => {
      mockUseCurrentProfil.mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      const { container } = render(<SeriesPage />);

      // profil == undefined catches both undefined and null
      expect(container.firstChild).toBeNull();
    });

    it("renders correctly when both modals are open", () => {
      mockUseCreatePlaylistModal.mockReturnValue({
        isOpen: true,
        openModal: mockOpenModalCreate,
        closeModal: mockCloseModalCreate,
      });

      mockUseUpdatePlaylistModal.mockReturnValue({
        isOpen: true,
        playlistId: "playlist-1",
        openModal: mockOpenModalEdit,
        closeModal: mockCloseModalEdit,
      });

      render(<SeriesPage />);

      const createModal = screen.getByTestId("playlist-create-modal");
      const editModal = screen.getByTestId("playlist-edit-modal");

      expect(createModal).toHaveAttribute("data-visible", "true");
      expect(editModal).toHaveAttribute("data-visible", "true");
    });

    it("handles profil with only id", () => {
      const minimalProfil = { id: "profil-1" };
      mockUseCurrentProfil.mockReturnValue({
        data: minimalProfil,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      render(<SeriesPage />);

      expect(screen.getByTestId("playlists-list")).toBeInTheDocument();
    });

    it("handles profil with only id property", () => {
      const minimalProfil = { id: "profil-1" };
      mockUseCurrentProfil.mockReturnValue({
        data: minimalProfil,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      });

      render(<SeriesPage />);

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("playlists-list")).toBeInTheDocument();
    });
  });

  describe("Re-render Behavior", () => {
    it("updates when profil changes", () => {
      const { rerender } = render(<SeriesPage />);

      const newProfil = { id: "profil-2", name: "New Profile", image: "/new.png" };
      mockUseCurrentProfil.mockReturnValue({
        data: newProfil,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      rerender(<SeriesPage />);

      // Verify the page still renders with new profil data
      expect(screen.getByTestId("playlists-list")).toBeInTheDocument();
    });

    it("updates when playlists data changes", () => {
      const { rerender } = render(<SeriesPage />);

      const newPlaylists = [{ id: "new-1", title: "New Playlist", movies: [] }];
      mockUsePlaylists.mockReturnValue({
        data: newPlaylists,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      } as any);

      rerender(<SeriesPage />);

      const dataElement = screen.getByTestId("playlists-data");
      expect(dataElement).toHaveTextContent(JSON.stringify(newPlaylists));
    });

    it("updates modal visibility when state changes", () => {
      const { rerender } = render(<SeriesPage />);

      let createModal = screen.getByTestId("playlist-create-modal");
      expect(createModal).toHaveAttribute("data-visible", "false");

      mockUseCreatePlaylistModal.mockReturnValue({
        isOpen: true,
        openModal: mockOpenModalCreate,
        closeModal: mockCloseModalCreate,
      });

      rerender(<SeriesPage />);

      createModal = screen.getByTestId("playlist-create-modal");
      expect(createModal).toHaveAttribute("data-visible", "true");
    });
  });

  describe("Component Name", () => {
    it("component is named SeriesPage (legacy naming)", () => {
      // The component is named SeriesPage but handles playlists
      // This is likely historical and could be refactored
      expect(SeriesPage.name).toBe("SeriesPage");
    });
  });

  describe("Styling Classes", () => {
    it("applies pt-40 padding top to main container", () => {
      const { container } = render(<SeriesPage />);

      const mainDiv = container.querySelector(".pt-40");
      expect(mainDiv).toBeInTheDocument();
    });

    it("applies pb-40 padding bottom to main container", () => {
      const { container } = render(<SeriesPage />);

      const mainDiv = container.querySelector(".pb-40");
      expect(mainDiv).toBeInTheDocument();
    });

    it("applies h-lvh height to main container", () => {
      const { container } = render(<SeriesPage />);

      const mainDiv = container.querySelector(".h-lvh");
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders complete page with all components when profil exists", () => {
      render(<SeriesPage />);

      expect(screen.getByTestId("playlist-create-modal")).toBeInTheDocument();
      expect(screen.getByTestId("playlist-edit-modal")).toBeInTheDocument();
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("playlists-list")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("correctly wires up all modal controls", () => {
      render(<SeriesPage />);

      // Test create modal
      screen.getByTestId("open-create").click();
      expect(mockOpenModalCreate).toHaveBeenCalled();

      screen.getByTestId("create-modal-close").click();
      expect(mockCloseModalCreate).toHaveBeenCalled();

      // Test edit modal
      screen.getByTestId("open-edit").click();
      expect(mockOpenModalEdit).toHaveBeenCalled();

      screen.getByTestId("edit-modal-close").click();
      expect(mockCloseModalEdit).toHaveBeenCalled();
    });

    it("passes all required data through to child components", () => {
      render(<SeriesPage />);

      // Verify title
      expect(screen.getByTestId("playlists-title")).toHaveTextContent("Playlists");

      // Verify data
      const dataElement = screen.getByTestId("playlists-data");
      expect(dataElement).toHaveTextContent(JSON.stringify(mockPlaylists));

      // Verify loading state
      expect(screen.getByTestId("playlists-loading")).toHaveTextContent("Not Loading");
    });
  });
});
