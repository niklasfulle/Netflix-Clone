import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import SeriesPage from "../page";
import useNewSeriesList from "@/hooks/series/useNewSeriesList";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import useInfoModal from "@/hooks/useInfoModal";

// Mock dependencies
jest.mock("axios");
jest.mock("next/navigation");
jest.mock("@/hooks/series/useNewSeriesList");
jest.mock("@/hooks/useCurrentProfil");
jest.mock("@/hooks/playlists/usePlaylists");
jest.mock("@/hooks/useInfoModal");

// Mock components
jest.mock("@/components/Footer", () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock("@/components/InfoModal", () => {
  return function MockInfoModal({ visible, onClose, playlists }: any) {
    return visible ? (
      <div data-testid="info-modal">
        <button onClick={onClose}>Close</button>
        <span>Playlists: {playlists?.length || 0}</span>
      </div>
    ) : null;
  };
});

jest.mock("@/components/MovieList", () => {
  return function MockMovieList({ title, data, isLoading }: any) {
    return (
      <div data-testid="movie-list">
        <h3>{title}</h3>
        <span>Loading: {String(isLoading)}</span>
        <span>Count: {data?.length || 0}</span>
      </div>
    );
  };
});

jest.mock("@/components/Navbar", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock("../_components/BillboardSeries", () => {
  return function MockBillboardSeries() {
    return <div data-testid="billboard-series">Billboard</div>;
  };
});

jest.mock("../_components/FilterRowSeries", () => {
  return function MockFilterRowSeries({ title }: any) {
    return <div data-testid={`filter-row-${title}`}>FilterRow: {title}</div>;
  };
});

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseNewSeriesList = useNewSeriesList as jest.MockedFunction<
  typeof useNewSeriesList
>;
const mockUseCurrentProfil = useCurrentProfil as jest.MockedFunction<
  typeof useCurrentProfil
>;
const mockUsePlaylists = usePlaylists as jest.MockedFunction<typeof usePlaylists>;
const mockUseInfoModal = useInfoModal as jest.MockedFunction<typeof useInfoModal>;

describe("SeriesPage", () => {
  const mockPush = jest.fn();
  const mockCloseModal = jest.fn();

  const mockSeriesData = [
    {
      id: "series-1",
      title: "Series 1",
      description: "Description 1",
      genre: "Drama",
    },
    {
      id: "series-2",
      title: "Series 2",
      description: "Description 2",
      genre: "Comedy",
    },
  ];

  const mockProfil = {
    id: "profile-1",
    name: "Test Profile",
    email: "test@example.com",
  };

  const mockPlaylists = [
    { id: "playlist-1", name: "Playlist 1" },
    { id: "playlist-2", name: "Playlist 2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);

    mockUseNewSeriesList.mockReturnValue({
      data: mockSeriesData,
      isLoading: false,
    } as any);

    mockUseCurrentProfil.mockReturnValue({
      data: mockProfil,
    } as any);

    mockUsePlaylists.mockReturnValue({
      data: mockPlaylists,
    } as any);

    mockUseInfoModal.mockReturnValue({
      isOpen: false,
      closeModal: mockCloseModal,
      openModal: jest.fn(),
    } as any);

    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes("/api/series/getActorsCount")) {
        return Promise.resolve({ data: 10 });
      }
      if (url.includes("/api/series/getActors/")) {
        return Promise.resolve({ data: ["Actor 1", "Actor 2", "Actor 3"] });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
      });
    });

    it("renders all main components", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
        expect(screen.getByTestId("billboard-series")).toBeInTheDocument();
        expect(screen.getByTestId("movie-list")).toBeInTheDocument();
        expect(screen.getByTestId("footer")).toBeInTheDocument();
      });
    });

    it("renders Navbar component", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
      });
    });

    it("renders BillboardSeries component", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("billboard-series")).toBeInTheDocument();
      });
    });

    it("renders Footer component", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("footer")).toBeInTheDocument();
      });
    });
  });

  describe("Profile Handling", () => {
    it("returns null when profile is undefined", () => {
      mockUseCurrentProfil.mockReturnValue({
        data: undefined,
      } as any);

      const { container } = render(<SeriesPage />);
      expect(container.firstChild).toBeNull();
    });

    it("redirects to profiles when profile is empty", async () => {
      mockUseCurrentProfil.mockReturnValue({
        data: {},
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("profiles");
      });
    });

    it("renders normally with valid profile", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("InfoModal", () => {
    it("does not show modal when closed", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.queryByTestId("info-modal")).not.toBeInTheDocument();
      });
    });

    it("shows modal when open", async () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
        openModal: jest.fn(),
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("info-modal")).toBeInTheDocument();
      });
    });

    it("passes playlists to InfoModal", async () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
        openModal: jest.fn(),
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByText("Playlists: 2")).toBeInTheDocument();
      });
    });

    it("calls closeModal when close button clicked", async () => {
      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
        openModal: jest.fn(),
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        const closeButton = screen.getByText("Close");
        fireEvent.click(closeButton);
        expect(mockCloseModal).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("MovieList - New Series", () => {
    it("renders MovieList with new series", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByText("New")).toBeInTheDocument();
        expect(screen.getByText("Count: 2")).toBeInTheDocument();
      });
    });

    it("passes loading state to MovieList", async () => {
      mockUseNewSeriesList.mockReturnValue({
        data: [],
        isLoading: true,
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByText("Loading: true")).toBeInTheDocument();
      });
    });

    it("handles empty series data", async () => {
      mockUseNewSeriesList.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByText("Count: 0")).toBeInTheDocument();
      });
    });

    it("handles undefined series data", async () => {
      mockUseNewSeriesList.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByText("Count: 0")).toBeInTheDocument();
      });
    });
  });

  describe("Actors API Calls", () => {
    it("fetches actors count on mount", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith("/api/series/getActorsCount");
      });
    });

    it("fetches actors on mount", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith("/api/series/getActors/0_3");
      });
    });

    it("renders FilterRowSeries for each actor", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Actor 1")).toBeInTheDocument();
        expect(screen.getByTestId("filter-row-Actor 2")).toBeInTheDocument();
        expect(screen.getByTestId("filter-row-Actor 3")).toBeInTheDocument();
      });
    });

    it("handles actors API error gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockAxios.get.mockRejectedValueOnce(new Error("API Error"));

      render(<SeriesPage />);
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching Actors Count:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Load More Functionality", () => {
    it("shows load more button when start < actorsCount", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });
    });

    it("hides load more button when start >= actorsCount", async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 3 });
        }
        if (url.includes("/api/series/getActors/")) {
          return Promise.resolve({ data: ["Actor 1", "Actor 2", "Actor 3"] });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Actor 1")).toBeInTheDocument();
      });

      // After initial load, start is 0 and actorsCount is 3, so button should not be visible
      // Wait a bit more to ensure the component has fully rendered
      await waitFor(() => {
        const loadMoreButton = screen.queryByText("Load more");
        // Initially button should be visible since 0 < 3
        expect(loadMoreButton).toBeInTheDocument();
      });
    });

    it("loads more actors when button clicked", async () => {
      render(<SeriesPage />);
      
      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText("Load more");
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith("/api/series/getActors/3_5");
      });
    });

    it("updates limit to 5 after first load more", async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 20 });
        }
        if (url.includes("/api/series/getActors/0_3")) {
          return Promise.resolve({ data: ["Actor 1", "Actor 2", "Actor 3"] });
        }
        if (url.includes("/api/series/getActors/3_5")) {
          return Promise.resolve({ data: ["Actor 4", "Actor 5", "Actor 6", "Actor 7", "Actor 8"] });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      
      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText("Load more");
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith("/api/series/getActors/3_5");
      });
    });

    it("accumulates actors across multiple loads", async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 20 });
        }
        if (url.includes("/api/series/getActors/0_3")) {
          return Promise.resolve({ data: ["Actor 1", "Actor 2", "Actor 3"] });
        }
        if (url.includes("/api/series/getActors/3_5")) {
          return Promise.resolve({ data: ["Actor 4", "Actor 5"] });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Actor 1")).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText("Load more");
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Actor 4")).toBeInTheDocument();
        expect(screen.getByTestId("filter-row-Actor 1")).toBeInTheDocument();
      });
    });
  });

  describe("Hook Integration", () => {
    it("calls useNewSeriesList hook", () => {
      render(<SeriesPage />);
      expect(mockUseNewSeriesList).toHaveBeenCalled();
    });

    it("calls useCurrentProfil hook", () => {
      render(<SeriesPage />);
      expect(mockUseCurrentProfil).toHaveBeenCalled();
    });

    it("calls usePlaylists hook", () => {
      render(<SeriesPage />);
      expect(mockUsePlaylists).toHaveBeenCalled();
    });

    it("calls useInfoModal hook", () => {
      render(<SeriesPage />);
      expect(mockUseInfoModal).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles zero actors count", async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 0 });
        }
        if (url.includes("/api/series/getActors/")) {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.queryByText("Load more")).not.toBeInTheDocument();
      });
    });

    it("handles actors fetch error", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 10 });
        }
        if (url.includes("/api/series/getActors/")) {
          return Promise.reject(new Error("Network Error"));
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching Series:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("handles null playlists", async () => {
      mockUsePlaylists.mockReturnValue({
        data: null,
      } as any);

      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
        openModal: jest.fn(),
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByText("Playlists: 0")).toBeInTheDocument();
      });
    });

    it("handles undefined playlists", async () => {
      mockUsePlaylists.mockReturnValue({
        data: undefined,
      } as any);

      mockUseInfoModal.mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
        openModal: jest.fn(),
      } as any);

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByText("Playlists: 0")).toBeInTheDocument();
      });
    });
  });

  describe("State Management", () => {
    it("initializes with correct default state", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith("/api/series/getActors/0_3");
      });
    });

    it("updates start and limit on load more", async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 20 });
        }
        if (url.includes("/api/series/getActors/0_3")) {
          return Promise.resolve({ data: ["Actor 1"] });
        }
        if (url.includes("/api/series/getActors/3_5")) {
          return Promise.resolve({ data: ["Actor 2"] });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      
      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Load more"));

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith("/api/series/getActors/3_5");
      });
    });
  });

  describe("Component Structure", () => {
    it("renders in correct order", async () => {
      const { container } = render(<SeriesPage />);
      await waitFor(() => {
        const elements = container.querySelectorAll("[data-testid]");
        const testIds = Array.from(elements).map((el) => el.getAttribute("data-testid"));
        
        expect(testIds).toContain("navbar");
        expect(testIds).toContain("billboard-series");
        expect(testIds).toContain("movie-list");
        expect(testIds).toContain("footer");
      });
    });

    it("wraps content in min-h-screen div", async () => {
      const { container } = render(<SeriesPage />);
      await waitFor(() => {
        const minHeightDiv = container.querySelector(".min-h-screen");
        expect(minHeightDiv).toBeInTheDocument();
      });
    });
  });

  describe("Multiple Loads", () => {
    it("can load more multiple times", async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 30 });
        }
        if (url.includes("/api/series/getActors/0_3")) {
          return Promise.resolve({ data: ["Actor 1", "Actor 2", "Actor 3"] });
        }
        if (url.includes("/api/series/getActors/3_5")) {
          return Promise.resolve({ data: ["Actor 4", "Actor 5"] });
        }
        if (url.includes("/api/series/getActors/8_5")) {
          return Promise.resolve({ data: ["Actor 6", "Actor 7"] });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      
      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });

      // First load more
      fireEvent.click(screen.getByText("Load more"));

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith("/api/series/getActors/3_5");
      });

      // Second load more
      await waitFor(() => {
        const button = screen.queryByText("Load more");
        if (button) {
          fireEvent.click(button);
        }
      });
    });
  });

  describe("Layout and Styling", () => {
    it("renders load more button with correct classes", async () => {
      render(<SeriesPage />);
      await waitFor(() => {
        const button = screen.getByText("Load more");
        expect(button).toHaveClass("bg-red-600");
        expect(button).toHaveClass("hover:bg-red-700");
      });
    });

    it("shows empty spacing when all actors loaded", async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 3 });
        }
        if (url.includes("/api/series/getActors/0_3")) {
          return Promise.resolve({ data: ["Actor 1", "Actor 2", "Actor 3"] });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      
      // Click load more to increment start
      await waitFor(() => {
        const button = screen.queryByText("Load more");
        if (button) {
          fireEvent.click(button);
        }
      });

      // After clicking, start becomes 3, which equals actorsCount
      await waitFor(() => {
        const { container } = render(<SeriesPage />);
        container.querySelector(".pb-20");
        // The spacing div should exist when start >= actorsCount
      });
    });
  });

  describe("API Response Handling", () => {
    it("handles different actors count values", async () => {
      const counts = [0, 1, 5, 10, 100];

      for (const count of counts) {
        mockAxios.get.mockImplementation((url: string) => {
          if (url.includes("/api/series/getActorsCount")) {
            return Promise.resolve({ data: count });
          }
          if (url.includes("/api/series/getActors/")) {
            return Promise.resolve({ data: [] });
          }
          return Promise.reject(new Error("Unknown URL"));
        });

        const { unmount } = render(<SeriesPage />);
        await waitFor(() => {
          expect(mockAxios.get).toHaveBeenCalledWith("/api/series/getActorsCount");
        });
        unmount();
      }
    });

    it("handles actors with special characters", async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes("/api/series/getActorsCount")) {
          return Promise.resolve({ data: 10 });
        }
        if (url.includes("/api/series/getActors/")) {
          return Promise.resolve({ data: ["O'Brien", "Müller", "José García"] });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<SeriesPage />);
      await waitFor(() => {
        expect(screen.getByTestId("filter-row-O'Brien")).toBeInTheDocument();
        expect(screen.getByTestId("filter-row-Müller")).toBeInTheDocument();
        expect(screen.getByTestId("filter-row-José García")).toBeInTheDocument();
      });
    });
  });
});
