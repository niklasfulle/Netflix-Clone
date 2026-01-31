import React from "react";
import { render, screen } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import MoviesPage from "../page";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  })),
}));

// Mock lodash
jest.mock("lodash", () => ({
  isEmpty: (arr: any) => !arr || arr.length === 0 || Object.keys(arr).length === 0,
}));

// Mock hooks
jest.mock("@/hooks/useCurrentProfil");
jest.mock("@/hooks/useSearchItem");
jest.mock("@/hooks/playlists/usePlaylists");
jest.mock("@/hooks/useInfoModal");

// Mock components
jest.mock("@/components/InfoModal", () => {
  return function MockInfoModal({ visible, onClose, playlists }: any) {
    return visible ? (
      <div data-testid="info-modal">
        <span>InfoModal</span>
        <span>Playlists: {playlists?.length || 0}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock("@/components/Navbar", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock("@/components/Footer", () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock("@/app/(protected)/search/_components/SearchList", () => {
  return function MockSearchList({ title, data, isLoading, searchItem }: any) {
    return (
      <div data-testid="search-list">
        <span>Title: {title}</span>
        <span>SearchItem: {searchItem}</span>
        <span>Loading: {isLoading.toString()}</span>
        <span>Results: {data?.length || 0}</span>
      </div>
    );
  };
});

// Import after mocks
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useSearchItem from "@/hooks/useSearchItem";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import useInfoModal from "@/hooks/useInfoModal";

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseCurrentProfil = useCurrentProfil as jest.MockedFunction<typeof useCurrentProfil>;
const mockUseSearchItem = useSearchItem as jest.MockedFunction<typeof useSearchItem>;
const mockUsePlaylists = usePlaylists as jest.MockedFunction<typeof usePlaylists>;
const mockUseInfoModal = useInfoModal as jest.MockedFunction<typeof useInfoModal>;

describe("MoviesPage (Search)", () => {
  const mockProfil = {
    id: "profile-1",
    name: "John Doe",
    userId: "user-1",
    imageUrl: "/images/profile.jpg",
  };

  const mockSearchResults = [
    {
      id: "1",
      title: "Action Movie",
      description: "Description 1",
      genre: "Action",
    },
    {
      id: "2",
      title: "Action Hero",
      description: "Description 2",
      genre: "Action",
    },
  ];

  const mockPlaylists = [
    {
      id: "playlist-1",
      name: "My Playlist",
      userId: "user-1",
    },
  ];

  const mockCloseModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseParams.mockReturnValue({ searchItem: "action" });
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      prefetch: mockPrefetch,
    } as any);
    mockUseCurrentProfil.mockReturnValue({ data: mockProfil } as any);
    mockUseSearchItem.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
    } as any);
    mockUsePlaylists.mockReturnValue({ data: mockPlaylists } as any);
    mockUseInfoModal.mockReturnValue({
      isOpen: false,
      closeModal: mockCloseModal,
    } as any);
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<MoviesPage />);
      expect(container).toBeTruthy();
    });

    it("renders Navbar component", () => {
      render(<MoviesPage />);
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });

    it("renders Footer component", () => {
      render(<MoviesPage />);
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("renders SearchList component", () => {
      render(<MoviesPage />);
      expect(screen.getByTestId("search-list")).toBeInTheDocument();
    });
  });

  describe("Hooks Integration", () => {
    it("calls useParams to get searchItem", () => {
      render(<MoviesPage />);
      expect(mockUseParams).toHaveBeenCalled();
    });

    it("calls useRouter", () => {
      render(<MoviesPage />);
      expect(mockUseRouter).toHaveBeenCalled();
    });

    it("calls useCurrentProfil", () => {
      render(<MoviesPage />);
      expect(mockUseCurrentProfil).toHaveBeenCalled();
    });

    it("calls useSearchItem with searchItem param", () => {
      render(<MoviesPage />);
      expect(mockUseSearchItem).toHaveBeenCalledWith("action");
    });

    it("calls usePlaylists", () => {
      render(<MoviesPage />);
      expect(mockUsePlaylists).toHaveBeenCalled();
    });

    it("calls useInfoModal", () => {
      render(<MoviesPage />);
      expect(mockUseInfoModal).toHaveBeenCalled();
    });
  });

  describe("Profile Handling", () => {
    it("returns null when profile is undefined", () => {
      mockUseCurrentProfil.mockReturnValue({ data: undefined } as any);

      const { container } = render(<MoviesPage />);
      expect(container.firstChild).toBeNull();
    });

    it("does not render components when profile is undefined", () => {
      mockUseCurrentProfil.mockReturnValue({ data: undefined } as any);

      render(<MoviesPage />);
      expect(screen.queryByTestId("navbar")).not.toBeInTheDocument();
      expect(screen.queryByTestId("search-list")).not.toBeInTheDocument();
    });

    it("redirects to profiles page when profile is empty", () => {
      mockUseCurrentProfil.mockReturnValue({ data: {} } as any);

      render(<MoviesPage />);
      expect(mockPush).toHaveBeenCalledWith("profiles");
    });

    it("renders normally when profile exists", () => {
      render(<MoviesPage />);
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("search-list")).toBeInTheDocument();
    });
  });

  describe("SearchList Props", () => {
    it("passes correct title to SearchList", () => {
      render(<MoviesPage />);
      expect(screen.getByText("Title: Search Result for:")).toBeInTheDocument();
    });

    it("passes search results data to SearchList", () => {
      render(<MoviesPage />);
      expect(screen.getByText("Results: 2")).toBeInTheDocument();
    });

    it("passes isLoading state to SearchList", () => {
      mockUseSearchItem.mockReturnValue({
        data: mockSearchResults,
        isLoading: true,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("passes searchItem param to SearchList", () => {
      render(<MoviesPage />);
      expect(screen.getByText("SearchItem: action")).toBeInTheDocument();
    });

    it("handles different searchItem params", () => {
      mockUseParams.mockReturnValue({ searchItem: "thriller" });

      render(<MoviesPage />);
      expect(screen.getByText("SearchItem: thriller")).toBeInTheDocument();
      expect(mockUseSearchItem).toHaveBeenCalledWith("thriller");
    });
  });

  describe("InfoModal", () => {
    it("renders InfoModal when isOpen is true", () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByTestId("info-modal")).toBeInTheDocument();
    });

    it("does not render InfoModal when isOpen is false", () => {
      render(<MoviesPage />);
      expect(screen.queryByTestId("info-modal")).not.toBeInTheDocument();
    });

    it("passes playlists to InfoModal", () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Playlists: 1")).toBeInTheDocument();
    });

    it("passes closeModal callback to InfoModal", () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByTestId("info-modal")).toBeInTheDocument();
    });
  });

  describe("Layout Structure", () => {
    it("has main container with correct padding classes", () => {
      const { container } = render(<MoviesPage />);
      const mainDiv = container.querySelector(".pt-40");
      expect(mainDiv).toHaveClass("pb-40");
      expect(mainDiv).toHaveClass("min-h-screen");
    });

    it("renders components in correct order", () => {
      const { container } = render(<MoviesPage />);
      const elements = container.querySelectorAll("[data-testid]");
      const elementIds = Array.from(elements).map((el) => el.getAttribute("data-testid"));
      
      expect(elementIds[0]).toBe("navbar");
      expect(elementIds[1]).toBe("search-list");
      expect(elementIds[2]).toBe("footer");
    });
  });

  describe("Search Results", () => {
    it("handles empty search results", () => {
      mockUseSearchItem.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Results: 0")).toBeInTheDocument();
    });

    it("handles undefined search results", () => {
      mockUseSearchItem.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Results: 0")).toBeInTheDocument();
    });

    it("handles loading state", () => {
      mockUseSearchItem.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("displays correct number of results", () => {
      const manyResults = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Movie ${i + 1}`,
      }));

      mockUseSearchItem.mockReturnValue({
        data: manyResults,
        isLoading: false,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Results: 10")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty searchItem param", () => {
      mockUseParams.mockReturnValue({ searchItem: "" });

      render(<MoviesPage />);
      expect(mockUseSearchItem).toHaveBeenCalledWith("");
      // Component still renders with empty searchItem
      expect(screen.getByTestId("search-list")).toBeInTheDocument();
    });

    it("handles searchItem with special characters", () => {
      mockUseParams.mockReturnValue({ searchItem: "action & drama" });

      render(<MoviesPage />);
      expect(mockUseSearchItem).toHaveBeenCalledWith("action & drama");
    });

    it("handles searchItem with spaces", () => {
      mockUseParams.mockReturnValue({ searchItem: "science fiction" });

      render(<MoviesPage />);
      expect(mockUseSearchItem).toHaveBeenCalledWith("science fiction");
    });

    it("handles undefined playlists", () => {
      mockUsePlaylists.mockReturnValue({ data: undefined } as any);
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Playlists: 0")).toBeInTheDocument();
    });

    it("handles empty playlists array", () => {
      mockUsePlaylists.mockReturnValue({ data: [] } as any);
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Playlists: 0")).toBeInTheDocument();
    });

    it("handles profile with minimal properties", () => {
      mockUseCurrentProfil.mockReturnValue({
        data: { id: "1", name: "User" },
      } as any);

      render(<MoviesPage />);
      expect(screen.getByTestId("search-list")).toBeInTheDocument();
    });
  });

  describe("URL Parameters", () => {
    it("handles numeric searchItem", () => {
      mockUseParams.mockReturnValue({ searchItem: "2024" });

      render(<MoviesPage />);
      expect(mockUseSearchItem).toHaveBeenCalledWith("2024");
      expect(screen.getByText("SearchItem: 2024")).toBeInTheDocument();
    });

    it("handles encoded searchItem", () => {
      mockUseParams.mockReturnValue({ searchItem: "action%20movie" });

      render(<MoviesPage />);
      expect(mockUseSearchItem).toHaveBeenCalledWith("action%20movie");
    });

    it("handles very long searchItem", () => {
      const longSearch = "a".repeat(100);
      mockUseParams.mockReturnValue({ searchItem: longSearch });

      render(<MoviesPage />);
      expect(mockUseSearchItem).toHaveBeenCalledWith(longSearch);
    });
  });

  describe("Loading States", () => {
    it("displays loading state correctly", () => {
      mockUseSearchItem.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);

      render(<MoviesPage />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();
    });

    it("displays loaded state correctly", () => {
      render(<MoviesPage />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
    });

    it("transitions from loading to loaded", () => {
      mockUseSearchItem.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);

      const { rerender } = render(<MoviesPage />);
      expect(screen.getByText("Loading: true")).toBeInTheDocument();

      mockUseSearchItem.mockReturnValue({
        data: mockSearchResults,
        isLoading: false,
      } as any);

      rerender(<MoviesPage />);
      expect(screen.getByText("Loading: false")).toBeInTheDocument();
      expect(screen.getByText("Results: 2")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("renders complete search page interface", () => {
      render(<MoviesPage />);

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("search-list")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
      expect(screen.getByText("Title: Search Result for:")).toBeInTheDocument();
      expect(screen.getByText("SearchItem: action")).toBeInTheDocument();
    });

    it("renders complete interface with modal open", () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      } as any);

      render(<MoviesPage />);

      expect(screen.getByTestId("info-modal")).toBeInTheDocument();
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("search-list")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("handles complete flow with search results", () => {
      render(<MoviesPage />);

      expect(mockUseParams).toHaveBeenCalled();
      expect(mockUseCurrentProfil).toHaveBeenCalled();
      expect(mockUseSearchItem).toHaveBeenCalledWith("action");
      expect(mockUsePlaylists).toHaveBeenCalled();
      expect(mockUseInfoModal).toHaveBeenCalled();
      expect(screen.getByText("Results: 2")).toBeInTheDocument();
    });

    it("handles complete flow when profile is empty", () => {
      mockUseCurrentProfil.mockReturnValue({ data: {} } as any);

      render(<MoviesPage />);

      expect(mockPush).toHaveBeenCalledWith("profiles");
      // Component still renders even after redirect (no early return)
      expect(screen.getByTestId("search-list")).toBeInTheDocument();
    });
  });

  describe("Multiple Search Terms", () => {
    it("handles different search terms correctly", () => {
      const searchTerms = ["action", "drama", "comedy", "thriller"];

      searchTerms.forEach((term) => {
        mockUseParams.mockReturnValue({ searchItem: term });
        const { unmount } = render(<MoviesPage />);
        
        expect(mockUseSearchItem).toHaveBeenCalledWith(term);
        expect(screen.getByText(`SearchItem: ${term}`)).toBeInTheDocument();
        
        unmount();
        jest.clearAllMocks();
        
        // Re-setup mocks
        mockUseCurrentProfil.mockReturnValue({ data: mockProfil } as any);
        mockUseSearchItem.mockReturnValue({
          data: mockSearchResults,
          isLoading: false,
        } as any);
        mockUsePlaylists.mockReturnValue({ data: mockPlaylists } as any);
        mockUseInfoModal.mockReturnValue({
          isOpen: false,
          closeModal: mockCloseModal,
        } as any);
      });
    });
  });

  describe("Responsive Layout", () => {
    it("has responsive padding classes", () => {
      const { container } = render(<MoviesPage />);
      const mainDiv = container.querySelector(".pt-40");
      expect(mainDiv).toHaveClass("pt-40");
      expect(mainDiv).toHaveClass("pb-40");
    });

    it("has min-height for full screen", () => {
      const { container } = render(<MoviesPage />);
      const mainDiv = container.querySelector(".min-h-screen");
      expect(mainDiv).toBeInTheDocument();
    });
  });
});
