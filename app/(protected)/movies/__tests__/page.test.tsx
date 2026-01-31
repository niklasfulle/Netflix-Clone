import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import MoviesPage from "../page";
import useNewMovieList2 from "@/hooks/movies/useNewMovieList2";
import usePlaylists from "@/hooks/playlists/usePlaylists";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import useInfoModal from "@/hooks/useInfoModal";

// Mock axios
jest.mock("axios");

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock custom hooks
jest.mock("@/hooks/movies/useNewMovieList2");
jest.mock("@/hooks/playlists/usePlaylists");
jest.mock("@/hooks/useCurrentProfil");
jest.mock("@/hooks/useInfoModal");

// Mock child components
jest.mock("@/components/Footer", () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

jest.mock("@/components/InfoModal", () => {
  return function MockInfoModal({ visible, onClose, playlists }: any) {
    return visible ? (
      <div data-testid="info-modal">
        <button onClick={onClose}>Close</button>
        <div data-testid="playlists-count">{playlists?.length || 0}</div>
      </div>
    ) : null;
  };
});

jest.mock("@/components/MovieList", () => {
  return function MockMovieList({ title, data, isLoading }: any) {
    if (isLoading) {
      return <div data-testid="movie-list-loading">Loading {title}...</div>;
    }
    return (
      <div data-testid="movie-list">
        <h2>{title}</h2>
        <div data-testid="movie-count">{data?.length || 0} movies</div>
      </div>
    );
  };
});

jest.mock("@/components/Navbar", () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Navbar</nav>;
  };
});

jest.mock("../_components/BillboardMovie", () => {
  return function MockBillboardMovie() {
    return <div data-testid="billboard-movie">Billboard</div>;
  };
});

jest.mock("../_components/FilterRowMovies", () => {
  return function MockFilterRowMovies({ title }: any) {
    return <div data-testid={`filter-row-${title}`}>Filter: {title}</div>;
  };
});

const mockMovies = [
  {
    id: "movie-1",
    title: "Movie 1",
    description: "Description 1",
    videoUrl: "/videos/1.mp4",
    thumbnailUrl: "/thumbnails/1.jpg",
  },
  {
    id: "movie-2",
    title: "Movie 2",
    description: "Description 2",
    videoUrl: "/videos/2.mp4",
    thumbnailUrl: "/thumbnails/2.jpg",
  },
];

const mockProfil = {
  id: "profil-1",
  name: "Test Profile",
  profileImage: "/images/profile.jpg",
};

const mockPlaylists = [
  { id: "playlist-1", name: "Favorites" },
  { id: "playlist-2", name: "Watch Later" },
];

describe("MoviesPage", () => {
  const mockPush = jest.fn();
  const mockCloseModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useNewMovieList2 as jest.Mock).mockReturnValue({
      data: mockMovies,
      isLoading: false,
    });

    (useCurrentProfil as jest.Mock).mockReturnValue({
      data: mockProfil,
    });

    (usePlaylists as jest.Mock).mockReturnValue({
      data: mockPlaylists,
    });

    (useInfoModal as unknown as jest.Mock).mockReturnValue({
      isOpen: false,
      closeModal: mockCloseModal,
    });

    (axios.get as jest.Mock).mockResolvedValue({ data: [] });
  });

  describe("Rendering", () => {
    it("renders without crashing", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 5 })
        .mockResolvedValueOnce({ data: ["Actor 1", "Actor 2"] });

      render(<MoviesPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
      });
    });

    it("renders all main components", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 5 })
        .mockResolvedValueOnce({ data: ["Actor 1"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
        expect(screen.getByTestId("billboard-movie")).toBeInTheDocument();
        expect(screen.getByTestId("movie-list")).toBeInTheDocument();
        expect(screen.getByTestId("footer")).toBeInTheDocument();
      });
    });

    it("renders InfoModal when open", async () => {
      (useInfoModal as unknown as jest.Mock).mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      });

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("info-modal")).toBeInTheDocument();
      });
    });

    it("does not render InfoModal when closed", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.queryByTestId("info-modal")).not.toBeInTheDocument();
      });
    });

    it("returns null when profile is undefined", () => {
      (useCurrentProfil as jest.Mock).mockReturnValue({
        data: undefined,
      });

      const { container } = render(<MoviesPage />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Profile Handling", () => {
    it("redirects to profiles when profile is empty", async () => {
      (useCurrentProfil as jest.Mock).mockReturnValue({
        data: {},
      });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("profiles");
      });
    });

    it("does not redirect when profile exists", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("renders content when profile is valid", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 5 })
        .mockResolvedValueOnce({ data: ["Actor 1"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
      });
    });
  });

  describe("API Integration", () => {
    it("fetches actors count on mount", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 10 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/movies/getActorsCount");
      });
    });

    it("fetches actors list on mount", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 5 })
        .mockResolvedValueOnce({ data: ["Actor 1", "Actor 2"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/movies/getActors/0_3");
      });
    });

    it("handles actors count fetch error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      
      (axios.get as jest.Mock)
        .mockRejectedValueOnce(new Error("API Error"))
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching Movies:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it("handles actors fetch error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 5 })
        .mockRejectedValueOnce(new Error("API Error"));

      render(<MoviesPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching product list:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it("updates actors count state after fetch", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 15 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/movies/getActorsCount");
      });
    });
  });

  describe("Actors Rendering", () => {
    it("renders FilterRowMovies for each actor", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 5 })
        .mockResolvedValueOnce({ data: ["Actor 1", "Actor 2", "Actor 3"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Actor 1")).toBeInTheDocument();
        expect(screen.getByTestId("filter-row-Actor 2")).toBeInTheDocument();
        expect(screen.getByTestId("filter-row-Actor 3")).toBeInTheDocument();
      });
    });

    it("renders no FilterRowMovies when actors list is empty", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.queryByTestId(/filter-row-/)).not.toBeInTheDocument();
      });
    });

    it("uses actor name as key for FilterRowMovies", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 5 })
        .mockResolvedValueOnce({ data: ["Unique Actor"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Unique Actor")).toBeInTheDocument();
      });
    });
  });

  describe("Load More Functionality", () => {
    it("shows load more button when more actors available", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 10 })
        .mockResolvedValueOnce({ data: ["Actor 1"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });
    });

    it("hides load more button when all actors loaded", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 2 })
        .mockResolvedValueOnce({ data: ["Actor 1", "Actor 2"] });

      render(<MoviesPage />);

      await waitFor(() => {
        const loadMoreButton = screen.queryByText("Load more");
        expect(loadMoreButton).not.toBeInTheDocument();
      });
    });

    it("calls loadMore when button is clicked", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 10 })
        .mockResolvedValueOnce({ data: ["Actor 1"] })
        .mockResolvedValueOnce({ data: ["Actor 2"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText("Load more");
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/movies/getActors/3_5");
      });
    });

    it("updates start and limit on load more", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 20 })
        .mockResolvedValueOnce({ data: ["Actor 1"] })
        .mockResolvedValueOnce({ data: ["Actor 2", "Actor 3"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Load more"));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/movies/getActors/3_5");
      });
    });

    it("concatenates new actors with existing ones", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 10 })
        .mockResolvedValueOnce({ data: ["Actor 1"] })
        .mockResolvedValueOnce({ data: ["Actor 2"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Actor 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Load more"));

      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Actor 1")).toBeInTheDocument();
        expect(screen.getByTestId("filter-row-Actor 2")).toBeInTheDocument();
      });
    });

    it("shows empty space when all actors loaded", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 1 })
        .mockResolvedValueOnce({ data: ["Actor 1"] });

      const { container } = render(<MoviesPage />);

      await waitFor(() => {
        const emptySpace = container.querySelector(".pb-20");
        expect(emptySpace).toBeInTheDocument();
      });
    });
  });

  describe("Hook Integration", () => {
    it("uses useNewMovieList2 hook", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(useNewMovieList2).toHaveBeenCalled();
      });
    });

    it("uses useCurrentProfil hook", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(useCurrentProfil).toHaveBeenCalled();
      });
    });

    it("uses usePlaylists hook", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(usePlaylists).toHaveBeenCalled();
      });
    });

    it("uses useInfoModal hook", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(useInfoModal).toHaveBeenCalled();
      });
    });

    it("passes movies data to MovieList", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("movie-count")).toHaveTextContent("2 movies");
      });
    });

    it("passes playlists to InfoModal", async () => {
      (useInfoModal as unknown as jest.Mock).mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      });

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("playlists-count")).toHaveTextContent("2");
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading state for MovieList", async () => {
      (useNewMovieList2 as jest.Mock).mockReturnValue({
        data: [],
        isLoading: true,
      });

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("movie-list-loading")).toBeInTheDocument();
      });
    });

    it("shows loaded state for MovieList", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("movie-list")).toBeInTheDocument();
        expect(screen.queryByTestId("movie-list-loading")).not.toBeInTheDocument();
      });
    });

    it("handles default empty array for movies", async () => {
      (useNewMovieList2 as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("movie-count")).toHaveTextContent("0 movies");
      });
    });
  });

  describe("InfoModal Interaction", () => {
    it("closes modal when closeModal is called", async () => {
      (useInfoModal as unknown as jest.Mock).mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      });

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("info-modal")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Close"));

      expect(mockCloseModal).toHaveBeenCalled();
    });

    it("passes correct props to InfoModal", async () => {
      (useInfoModal as unknown as jest.Mock).mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      });

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("info-modal")).toBeInTheDocument();
        expect(screen.getByTestId("playlists-count")).toHaveTextContent("2");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles zero actors count", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.queryByText("Load more")).not.toBeInTheDocument();
      });
    });

    it("handles large actors count", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 1000 })
        .mockResolvedValueOnce({ data: ["Actor 1", "Actor 2"] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByText("Load more")).toBeInTheDocument();
      });
    });

    it("handles empty movies list", async () => {
      (useNewMovieList2 as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("movie-count")).toHaveTextContent("0 movies");
      });
    });

    it("handles empty playlists", async () => {
      (usePlaylists as jest.Mock).mockReturnValue({
        data: [],
      });

      (useInfoModal as unknown as jest.Mock).mockReturnValue({
        isOpen: true,
        closeModal: mockCloseModal,
      });

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 0 })
        .mockResolvedValueOnce({ data: [] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("playlists-count")).toHaveTextContent("0");
      });
    });

    it("handles actors with special characters", async () => {
      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: 5 })
        .mockResolvedValueOnce({ data: ["Actor & Name", "Actor \"Special\""] });

      render(<MoviesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("filter-row-Actor & Name")).toBeInTheDocument();
      });
    });
  });
});
