import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dependencies before imports
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

jest.mock("react-icons/ai", () => ({
  AiOutlineArrowLeft: (props: any) => (
    <svg {...props} data-testid="back-icon">
      Back Icon
    </svg>
  ),
}));

jest.mock("@/hooks/useRandom");
jest.mock("@/actions/watch/update-watch-time", () => ({
  updateWatchTime: jest.fn(),
}));

// Import after mocks
import RandomPage from "../page";
import useRandom from "@/hooks/useRandom";
import { updateWatchTime } from "@/actions/watch/update-watch-time";

const mockUseRandom = useRandom as jest.MockedFunction<typeof useRandom>;
const mockUpdateWatchTime = updateWatchTime as jest.MockedFunction<typeof updateWatchTime>;

describe("RandomPage", () => {
  const mockMovie = {
    id: "movie-1",
    title: "Test Movie",
    description: "Test Description",
    videoUrl: "/videos/test.mp4",
    thumbnailUrl: "/images/test.jpg",
    genre: "Action",
    duration: "120 min",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRandom.mockReturnValue({ data: mockMovie } as any);
    mockUpdateWatchTime.mockResolvedValue({ success: "Watch time updated!" } as any);

    // Mock document.getElementById - set default mock
    const mockVideo = {
      currentTime: 0,
    };
    globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      render(<RandomPage />);
      expect(screen.getByText(/Watching:/i)).toBeInTheDocument();
    });

    it("renders the movie title", () => {
      render(<RandomPage />);
      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("renders navigation bar", () => {
      render(<RandomPage />);
      expect(screen.getByText(/Watching:/i)).toBeInTheDocument();
    });
  });

  describe("Movie Loading States", () => {
    it("returns null when movie is undefined", () => {
      mockUseRandom.mockReturnValue({ data: undefined } as any);
      const { container } = render(<RandomPage />);
      expect(container.firstChild).toBeNull();
    });

    it("renders when movie data is available", () => {
      render(<RandomPage />);
      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("calls useRandom hook", () => {
      render(<RandomPage />);
      expect(mockUseRandom).toHaveBeenCalled();
    });
  });

  describe("Navigation Bar", () => {
    it("displays back icon", () => {
      render(<RandomPage />);
      expect(screen.getByTestId("back-icon")).toBeInTheDocument();
    });

    it("displays 'Watching:' label", () => {
      render(<RandomPage />);
      expect(screen.getByText(/Watching:/i)).toBeInTheDocument();
    });

    it("displays movie title in navigation", () => {
      render(<RandomPage />);
      const title = screen.getByText("Test Movie");
      expect(title).toBeInTheDocument();
    });

    it("has proper styling classes on nav", () => {
      const { container } = render(<RandomPage />);
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("fixed", "top-8", "z-10");
    });
  });

  describe("Back Button Functionality", () => {
    it("calls setMovieWatchTime when back button is clicked", async () => {
      const mockVideo = { currentTime: 45.5 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 46, // Math.round(45.5)
        });
      });
    });

    it("navigates to home page after clicking back", async () => {
      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("rounds watch time to nearest second", async () => {
      const mockVideo = { currentTime: 123.7 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 124,
        });
      });
    });

    it("updates watch time before navigating", async () => {
      const mockVideo = { currentTime: 30 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });

  describe("Video Element", () => {
    it("renders video element", () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("video");
      expect(video).toBeInTheDocument();
    });

    it("sets video id to 'videoElement'", () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("#videoElement");
      expect(video).toBeInTheDocument();
    });

    it("sets autoPlay attribute", () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("video");
      expect(video).toHaveAttribute("autoPlay");
    });

    it("sets controls attribute", () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("video");
      expect(video).toHaveAttribute("controls");
    });

    it("uses movie thumbnail as poster", () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("video");
      expect(video).toHaveAttribute("poster", "/images/test.jpg");
    });

    it("sets correct video source", () => {
      const { container } = render(<RandomPage />);
      const source = container.querySelector("source");
      expect(source).toHaveAttribute("src", "/api/video/movie-1");
    });

    it("sets video type to mp4", () => {
      const { container } = render(<RandomPage />);
      const source = container.querySelector("source");
      expect(source).toHaveAttribute("type", "video/mp4");
    });

    it("includes captions track", () => {
      const { container } = render(<RandomPage />);
      const track = container.querySelector("track");
      expect(track).toBeInTheDocument();
      expect(track).toHaveAttribute("kind", "captions");
    });
  });

  describe("Watch Time Updates - Manual", () => {
    it("gets video element by id when updating watch time", async () => {
      const mockVideo = { currentTime: 60 };
      const getElementByIdSpy = jest.fn().mockReturnValue(mockVideo);
      globalThis.document.getElementById = getElementByIdSpy;

      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(getElementByIdSpy).toHaveBeenCalledWith("videoElement");
      });
    });

    it("calls updateWatchTime with correct movie id", async () => {
      const mockVideo = { currentTime: 100 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 100,
        });
      });
    });

    it("handles zero watch time", async () => {
      const mockVideo = { currentTime: 0 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 0,
        });
      });
    });
  });

  describe("Auto-save Watch Time", () => {
    it("video element exists for auto-save functionality", () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("video");
      expect(video).toBeInTheDocument();
    });

    it("auto-saves watch time at 10 second intervals", async () => {
      const mockVideo = { currentTime: 10 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      const { container } = render(<RandomPage />);
      const video = container.querySelector("video") as HTMLVideoElement;

      // Create a mock ref
      Object.defineProperty(video, "currentTime", {
        writable: true,
        value: 10,
      });

      fireEvent.timeUpdate(video);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 10,
        });
      });
    });

    it("does not save at non-10-second intervals", () => {
      const mockVideo = { currentTime: 15 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      const { container } = render(<RandomPage />);
      const video = container.querySelector("video") as HTMLVideoElement;

      Object.defineProperty(video, "currentTime", {
        writable: true,
        value: 15,
      });

      mockUpdateWatchTime.mockClear();

      fireEvent.timeUpdate(video);

      // Should not be called for non-10-second marks
      expect(mockUpdateWatchTime).not.toHaveBeenCalled();
    });

    it("auto-saves at multiple 10-second intervals", async () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("video") as HTMLVideoElement;

      // Test at 20 seconds
      const mockVideo20 = { currentTime: 20 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo20);
      Object.defineProperty(video, "currentTime", {
        writable: true,
        value: 20,
      });

      fireEvent.timeUpdate(video);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 20,
        });
      });

      mockUpdateWatchTime.mockClear();

      // Test at 30 seconds
      const mockVideo30 = { currentTime: 30 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo30);
      Object.defineProperty(video, "currentTime", {
        writable: true,
        value: 30,
      });

      fireEvent.timeUpdate(video);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 30,
        });
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles movie with long title", () => {
      const longTitleMovie = {
        ...mockMovie,
        title: "A Very Long Movie Title That Spans Multiple Lines And Tests Overflow Handling",
      };
      mockUseRandom.mockReturnValue({ data: longTitleMovie } as any);

      render(<RandomPage />);
      expect(screen.getByText(longTitleMovie.title)).toBeInTheDocument();
    });

    it("handles movie without thumbnail", () => {
      const noThumbnailMovie = {
        ...mockMovie,
        thumbnailUrl: "",
      };
      mockUseRandom.mockReturnValue({ data: noThumbnailMovie } as any);

      const { container } = render(<RandomPage />);
      const video = container.querySelector("video");
      expect(video).toHaveAttribute("poster", "");
    });

    it("updates watch time with decimal currentTime", async () => {
      const mockVideo = { currentTime: 45.8 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 46,
        });
      });
    });

    it("handles very large watch times", async () => {
      const mockVideo = { currentTime: 7200 }; // 2 hours
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");

      fireEvent.click(backIcon);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 7200,
        });
      });
    });
  });

  describe("Layout and Styling", () => {
    it("has full-screen black background", () => {
      const { container } = render(<RandomPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass("w-screen", "h-screen", "bg-black");
    });

    it("video element has full width and height", () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("video");
      expect(video).toHaveClass("w-full", "h-full");
    });

    it("navigation has proper z-index", () => {
      const { container } = render(<RandomPage />);
      const nav = container.querySelector("nav");
      expect(nav).toHaveClass("z-10");
    });

    it("back icon is clickable", () => {
      render(<RandomPage />);
      const backIcon = screen.getByTestId("back-icon");
      expect(backIcon).toHaveClass("cursor-pointer");
    });
  });

  describe("Integration", () => {
    it("completes full watch and navigation workflow", async () => {
      const mockVideo = { currentTime: 120 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);

      render(<RandomPage />);

      // Verify movie is displayed
      expect(screen.getByText("Test Movie")).toBeInTheDocument();

      // Click back button
      const backIcon = screen.getByTestId("back-icon");
      fireEvent.click(backIcon);

      // Verify watch time is saved
      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 120,
        });
      });

      // Verify navigation happens
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("handles complete auto-save workflow", async () => {
      const { container } = render(<RandomPage />);
      const video = container.querySelector("video") as HTMLVideoElement;

      // Simulate watching video at 10-second mark
      const mockVideo = { currentTime: 10 };
      globalThis.document.getElementById = jest.fn().mockReturnValue(mockVideo);
      Object.defineProperty(video, "currentTime", {
        writable: true,
        value: 10,
      });

      fireEvent.timeUpdate(video);

      await waitFor(() => {
        expect(mockUpdateWatchTime).toHaveBeenCalledWith({
          movieId: "movie-1",
          watchTime: 10,
        });
      });
    });

    it("renders complete video player interface", () => {
      const { container } = render(<RandomPage />);

      // Check all major elements exist
      expect(screen.getByTestId("back-icon")).toBeInTheDocument();
      expect(screen.getByText(/Watching:/i)).toBeInTheDocument();
      expect(screen.getByText("Test Movie")).toBeInTheDocument();
      expect(container.querySelector("video")).toBeInTheDocument();
      expect(container.querySelector("source")).toBeInTheDocument();
      expect(container.querySelector("track")).toBeInTheDocument();
    });
  });
});
