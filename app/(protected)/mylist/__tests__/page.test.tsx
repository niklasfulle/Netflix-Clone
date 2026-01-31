import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";

import usePlaylists from "@/hooks/playlists/usePlaylists";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useFavorites from "@/hooks/useFavorites";
import useInfoModal from "@/hooks/useInfoModal";

// Mock all dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useCurrentProfil");
jest.mock("@/hooks/useFavorites");
jest.mock("@/hooks/playlists/usePlaylists");
jest.mock("@/hooks/useInfoModal");

jest.mock("@/components/Footer", () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock("@/components/InfoModal", () => {
  return function MockInfoModal({ visible, onClose, playlists }: any) {
    return (
      <div data-testid="info-modal">
        <span data-testid="modal-visible">{String(visible)}</span>
        <span data-testid="modal-playlists">{JSON.stringify(playlists)}</span>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock("@/components/Navbar", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock("../_components/SearchList", () => {
  return function MockSearchList({ title, data, isLoading }: any) {
    return (
      <div data-testid="search-list">
        <span data-testid="search-list-title">{title}</span>
        <span data-testid="search-list-loading">{String(isLoading)}</span>
        <span data-testid="search-list-data">{JSON.stringify(data)}</span>
      </div>
    );
  };
});

// Import component after mocks
import MyListPage from "../page";

describe("MyListPage", () => {
  const mockPush = jest.fn();
  const mockCloseModal = jest.fn();

  const mockProfil = {
    id: "profil-1",
    name: "Test User",
    image: "/images/profile.png",
    userId: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockFavorites = [
    {
      id: "movie-1",
      title: "Favorite Movie 1",
      description: "Description 1",
      videoUrl: "/videos/1.mp4",
      thumbnailUrl: "/thumbnails/1.jpg",
      genre: "Action",
      duration: "120 min",
    },
    {
      id: "movie-2",
      title: "Favorite Movie 2",
      description: "Description 2",
      videoUrl: "/videos/2.mp4",
      thumbnailUrl: "/thumbnails/2.jpg",
      genre: "Drama",
      duration: "90 min",
    },
  ];

  const mockPlaylists = [
    {
      id: "playlist-1",
      name: "My Playlist",
      profilId: "profil-1",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useCurrentProfil as jest.Mock).mockReturnValue({
      data: mockProfil,
    });

    (useFavorites as jest.Mock).mockReturnValue({
      data: mockFavorites,
      isLoading: false,
    });

    (usePlaylists as jest.Mock).mockReturnValue({
      data: mockPlaylists,
    });

    (useInfoModal as unknown as jest.Mock).mockReturnValue({
      isOpen: false,
      closeModal: mockCloseModal,
    });
  });

  describe("Rendering", () => {
    it("renders all main components", () => {
      render(<MyListPage />);

      expect(screen.getByTestId("info-modal")).toBeInTheDocument();
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("search-list")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("renders with correct layout classes", () => {
      const { container } = render(<MyListPage />);

      const mainDiv = container.querySelector(".pt-40.pb-40.h-lvh");
      expect(mainDiv).toBeInTheDocument();
    });

    it("renders SearchList with 'My List' title", () => {
      render(<MyListPage />);

      expect(screen.getByTestId("search-list-title")).toHaveTextContent("My List");
    });
  });

  describe("Profile Handling", () => {
    it("returns null when profile is undefined", () => {
      (useCurrentProfil as jest.Mock).mockReturnValue({
        data: undefined,
      });

      const { container } = render(<MyListPage />);

      expect(container.firstChild).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("redirects to profiles when profile is empty object", () => {
      (useCurrentProfil as jest.Mock).mockReturnValue({
        data: {},
      });

      render(<MyListPage />);

      expect(mockPush).toHaveBeenCalledWith("profiles");
    });

    it("returns null when profile is null", () => {
      (useCurrentProfil as jest.Mock).mockReturnValue({
        data: null,
      });

      const { container } = render(<MyListPage />);

      // profil == undefined catches both undefined and null (loose equality)
      expect(container.firstChild).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("renders normally with valid profile", () => {
      render(<MyListPage />);

      expect(screen.getByTestId("search-list")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Favorites Integration", () => {
    it("passes favorites data to SearchList", () => {
      render(<MyListPage />);

      const dataElement = screen.getByTestId("search-list-data");
      expect(dataElement).toHaveTextContent(JSON.stringify(mockFavorites));
    });

    it("passes loading state to SearchList", () => {
      (useFavorites as jest.Mock).mockReturnValue({
        data: mockFavorites,
        isLoading: true,
      });

      render(<MyListPage />);

      expect(screen.getByTestId("search-list-loading")).toHaveTextContent("true");
    });

    it("handles empty favorites array", () => {
      (useFavorites as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<MyListPage />);

      const dataElement = screen.getByTestId("search-list-data");
      expect(dataElement).toHaveTextContent("[]");
    });

    it("defaults to empty array when favorites data is undefined", () => {
      (useFavorites as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      render(<MyListPage />);

      const dataElement = screen.getByTestId("search-list-data");
      expect(dataElement).toHaveTextContent("[]");
    });

    it("handles loading state false", () => {
      render(<MyListPage />);

      expect(screen.getByTestId("search-list-loading")).toHaveTextContent("false");
    });
  });

  describe("Playlists Integration", () => {
    it("passes playlists to InfoModal", () => {
      render(<MyListPage />);

      const playlistsElement = screen.getByTestId("modal-playlists");
      expect(playlistsElement).toHaveTextContent(JSON.stringify(mockPlaylists));
    });

    it("handles undefined playlists", () => {
      (usePlaylists as jest.Mock).mockReturnValue({
        data: undefined,
      });

      render(<MyListPage />);

      const playlistsElement = screen.getByTestId("modal-playlists");
      expect(playlistsElement).toBeInTheDocument();
    });

    it("handles empty playlists array", () => {
      (usePlaylists as jest.Mock).mockReturnValue({
        data: [],
      });

      render(<MyListPage />);

      const playlistsElement = screen.getByTestId("modal-playlists");
      expect(playlistsElement).toHaveTextContent("[]");
    });
  });

  describe("Info Modal Integration", () => {
    it("passes modal open state to InfoModal", () => {
      (useInfoModal as unknown as jest.Mock).mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      });

      render(<MyListPage />);

      expect(screen.getByTestId("modal-visible")).toHaveTextContent("true");
    });

    it("passes modal closed state to InfoModal", () => {
      render(<MyListPage />);

      expect(screen.getByTestId("modal-visible")).toHaveTextContent("false");
    });

    it("passes closeModal function to InfoModal", () => {
      render(<MyListPage />);

      const closeButton = screen.getByRole("button", { name: /close/i });
      closeButton.click();

      expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });
  });

  describe("Hook Integration", () => {
    it("calls useRouter hook", () => {
      render(<MyListPage />);

      expect(useRouter).toHaveBeenCalled();
    });

    it("calls useCurrentProfil hook", () => {
      render(<MyListPage />);

      expect(useCurrentProfil).toHaveBeenCalled();
    });

    it("calls useFavorites hook", () => {
      render(<MyListPage />);

      expect(useFavorites).toHaveBeenCalled();
    });

    it("calls usePlaylists hook", () => {
      render(<MyListPage />);

      expect(usePlaylists).toHaveBeenCalled();
    });

    it("calls useInfoModal hook", () => {
      render(<MyListPage />);

      expect(useInfoModal).toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("renders while favorites are loading", () => {
      (useFavorites as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });

      render(<MyListPage />);

      expect(screen.getByTestId("search-list")).toBeInTheDocument();
      expect(screen.getByTestId("search-list-loading")).toHaveTextContent("true");
    });

    it("renders when favorites finish loading", () => {
      (useFavorites as jest.Mock).mockReturnValue({
        data: mockFavorites,
        isLoading: false,
      });

      render(<MyListPage />);

      expect(screen.getByTestId("search-list")).toBeInTheDocument();
      expect(screen.getByTestId("search-list-loading")).toHaveTextContent("false");
    });
  });

  describe("Data Variations", () => {
    it("handles large favorites list", () => {
      const largeFavorites = Array.from({ length: 100 }, (_, i) => ({
        id: `movie-${i}`,
        title: `Movie ${i}`,
        description: `Description ${i}`,
        videoUrl: `/videos/${i}.mp4`,
        thumbnailUrl: `/thumbnails/${i}.jpg`,
        genre: "Action",
        duration: "120 min",
      }));

      (useFavorites as jest.Mock).mockReturnValue({
        data: largeFavorites,
        isLoading: false,
      });

      render(<MyListPage />);

      expect(screen.getByTestId("search-list")).toBeInTheDocument();
    });

    it("handles favorites with special characters", () => {
      const specialFavorites = [
        {
          id: "movie-special",
          title: "Movie & Title <> 'Quotes'",
          description: 'Description with "quotes"',
          videoUrl: "/videos/special.mp4",
          thumbnailUrl: "/thumbnails/special.jpg",
          genre: "Action",
          duration: "120 min",
        },
      ];

      (useFavorites as jest.Mock).mockReturnValue({
        data: specialFavorites,
        isLoading: false,
      });

      render(<MyListPage />);

      expect(screen.getByTestId("search-list")).toBeInTheDocument();
    });

    it("handles multiple playlists", () => {
      const multiplePlaylists = Array.from({ length: 5 }, (_, i) => ({
        id: `playlist-${i}`,
        name: `Playlist ${i}`,
        profilId: "profil-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      }));

      (usePlaylists as jest.Mock).mockReturnValue({
        data: multiplePlaylists,
      });

      render(<MyListPage />);

      expect(screen.getByTestId("info-modal")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles re-render with same data", () => {
      const { rerender } = render(<MyListPage />);

      rerender(<MyListPage />);

      expect(screen.getByTestId("search-list")).toBeInTheDocument();
    });

    it("handles changing from loading to loaded state", () => {
      const { rerender } = render(<MyListPage />);

      (useFavorites as jest.Mock).mockReturnValue({
        data: mockFavorites,
        isLoading: true,
      });

      rerender(<MyListPage />);

      expect(screen.getByTestId("search-list-loading")).toHaveTextContent("true");

      (useFavorites as jest.Mock).mockReturnValue({
        data: mockFavorites,
        isLoading: false,
      });

      rerender(<MyListPage />);

      expect(screen.getByTestId("search-list-loading")).toHaveTextContent("false");
    });

    it("handles modal state changes", () => {
      const { rerender } = render(<MyListPage />);

      expect(screen.getByTestId("modal-visible")).toHaveTextContent("false");

      (useInfoModal as unknown as jest.Mock).mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      });

      rerender(<MyListPage />);

      expect(screen.getByTestId("modal-visible")).toHaveTextContent("true");
    });

    it("handles profile becoming empty", () => {
      const { rerender } = render(<MyListPage />);

      expect(screen.getByTestId("search-list")).toBeInTheDocument();

      (useCurrentProfil as jest.Mock).mockReturnValue({
        data: {},
      });

      rerender(<MyListPage />);

      expect(mockPush).toHaveBeenCalledWith("profiles");
    });

    it("handles profile becoming undefined", () => {
      render(<MyListPage />);

      expect(screen.getByTestId("search-list")).toBeInTheDocument();

      (useCurrentProfil as jest.Mock).mockReturnValue({
        data: undefined,
      });

      const { container } = render(<MyListPage />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Component Structure", () => {
    it("renders InfoModal before other components", () => {
      render(<MyListPage />);

      const infoModal = screen.getByTestId("info-modal");
      const navbar = screen.getByTestId("navbar");

      expect(infoModal).toBeInTheDocument();
      expect(infoModal.compareDocumentPosition(navbar)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    it("renders Navbar before SearchList", () => {
      render(<MyListPage />);

      const navbar = screen.getByTestId("navbar");
      const searchList = screen.getByTestId("search-list");

      expect(navbar.compareDocumentPosition(searchList)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    it("renders SearchList before Footer", () => {
      render(<MyListPage />);

      const searchList = screen.getByTestId("search-list");
      const footer = screen.getByTestId("footer");

      expect(searchList.compareDocumentPosition(footer)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    it("wraps SearchList in proper container", () => {
      const { container } = render(<MyListPage />);

      const wrapper = container.querySelector(".pt-40.pb-40.h-lvh");
      const searchList = screen.getByTestId("search-list");

      expect(wrapper).toContainElement(searchList);
    });
  });
});
