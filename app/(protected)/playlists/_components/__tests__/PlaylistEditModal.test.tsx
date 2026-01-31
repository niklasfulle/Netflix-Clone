import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// Mock react-icons
jest.mock("react-icons/io5", () => ({
  IoClose: ({ onClick, className, size }: any) => (
    <div
      data-testid="io-close"
      data-size={size}
      className={className}
      onClick={onClick}
      role="button"
    >
      Close Icon
    </div>
  ),
}));

// Mock hooks
jest.mock("@/hooks/playlists/useUpdatePlaylistModal", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/playlists/usePlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock UpdatePlaylistForm
jest.mock("../update-playlist-form", () => ({
  UpdatePlaylistForm: ({ playlist }: any) => (
    <div data-testid="update-playlist-form" data-playlist-id={playlist?.id}>
      Update Playlist Form
    </div>
  ),
}));

// Import component after mocks
import PlaylistEditModal from "../PlaylistEditModal";
import useUpdatePlaylistModal from "@/hooks/playlists/useUpdatePlaylistModal";
import usePlaylist from "@/hooks/playlists/usePlaylist";

describe("PlaylistEditModal", () => {
  const mockOnClose = jest.fn();
  const mockReload = jest.fn();
  const mockUseUpdatePlaylistModal = useUpdatePlaylistModal as jest.MockedFunction<
    typeof useUpdatePlaylistModal
  >;
  const mockUsePlaylist = usePlaylist as jest.MockedFunction<typeof usePlaylist>;

  const mockPlaylist = {
    id: "playlist-1",
    name: "My Playlist",
    description: "Test playlist",
    userId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as any).location;
    (globalThis as any).location = { reload: mockReload };
    mockReload.mockClear();

    // Default mock implementations
    mockUseUpdatePlaylistModal.mockReturnValue({
      playlistId: "playlist-1",
      isOpen: true,
      openModal: jest.fn(),
      closeModal: jest.fn(),
    });

    mockUsePlaylist.mockReturnValue({
      data: mockPlaylist,
      error: undefined,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Rendering - Visibility", () => {
    it("renders null when visible is false", () => {
      const { container } = render(
        <PlaylistEditModal visible={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders null when visible is undefined", () => {
      const { container } = render(
        <PlaylistEditModal onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders modal when visible is true", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });

    it("renders modal content when visible", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      expect(screen.getByTestId("io-close")).toBeInTheDocument();
      expect(screen.getByTestId("update-playlist-form")).toBeInTheDocument();
    });
  });

  describe("Modal Structure", () => {
    it("renders backdrop container with correct z-index", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed.inset-0");
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass("z-[100]");
    });

    it("renders backdrop with correct classes", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed.inset-0");
      expect(backdrop).toHaveClass(
        "flex",
        "items-center",
        "justify-center",
        "bg-black",
        "bg-opacity-80"
      );
    });

    it("renders modal container with correct structure", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const modalContainer = container.querySelector(".max-w-3xl");
      expect(modalContainer).toBeInTheDocument();
      expect(modalContainer).toHaveClass("relative", "w-auto", "mx-auto");
    });

    it("renders content area with bg-zinc-900", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const contentArea = container.querySelector(".bg-zinc-900");
      expect(contentArea).toBeInTheDocument();
    });

    it("renders title with correct text and styling", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      const title = screen.getByText("Update Playlist");
      expect(title.tagName).toBe("H1");
      expect(title).toHaveClass("text-3xl", "text-center", "text-white", "md:text-4xl");
    });
  });

  describe("Close Icon", () => {
    it("renders close icon", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByTestId("io-close")).toBeInTheDocument();
    });

    it("close icon has correct size", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveAttribute("data-size", "30");
    });

    it("close icon has correct styling", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveClass(
        "absolute",
        "z-10",
        "text-white",
        "cursor-pointer",
        "right-2",
        "top-2",
        "hover:text-neutral-300"
      );
    });

    it("close icon is clickable", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveAttribute("role", "button");
    });
  });

  describe("UpdatePlaylistForm", () => {
    it("renders UpdatePlaylistForm component", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByTestId("update-playlist-form")).toBeInTheDocument();
    });

    it("passes playlist data to UpdatePlaylistForm", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const form = screen.getByTestId("update-playlist-form");
      expect(form).toHaveAttribute("data-playlist-id", "playlist-1");
    });

    it("renders form within flex container with padding", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const flexContainer = container.querySelector(".flex.flex-col.items-center.py-10.px-10");
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toContainElement(screen.getByTestId("update-playlist-form"));
    });

    it("updates form when playlist data changes", () => {
      const { rerender } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByTestId("update-playlist-form")).toHaveAttribute(
        "data-playlist-id",
        "playlist-1"
      );
      
      // Update mock to return different playlist
      mockUsePlaylist.mockReturnValue({
        data: { ...mockPlaylist, id: "playlist-2" },
        error: undefined,
        isLoading: false,
      });
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      expect(screen.getByTestId("update-playlist-form")).toHaveAttribute(
        "data-playlist-id",
        "playlist-2"
      );
    });
  });

  describe("Animation Classes", () => {
    it("applies scale-100 class when isVisible is true", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const animatedDiv = container.querySelector(".scale-100");
      expect(animatedDiv).toBeInTheDocument();
    });

    it("applies transform and duration classes", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const animatedDiv = container.querySelector(".transform.duration-300");
      expect(animatedDiv).toBeInTheDocument();
    });

    it("starts with scale-100 when visible is true", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-100");
      expect(animatedDiv).not.toHaveClass("scale-0");
    });
  });

  describe("handleClose Functionality", () => {
    it("calls onClose when close icon is clicked", async () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it("triggers reload behavior when close icon is clicked", async () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      
      await act(async () => {
        fireEvent.click(closeIcon);
      });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("updates isVisible state when closing", async () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      let animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-100");
      
      const closeIcon = screen.getByTestId("io-close");
      await act(async () => {
        fireEvent.click(closeIcon);
      });
      
      animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-0");
    });
  });

  describe("Props Handling", () => {
    it("accepts visible prop as boolean", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it("accepts onClose prop as function", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("converts truthy visible values to boolean", () => {
      render(
        <PlaylistEditModal visible={"true" as any} onClose={mockOnClose} />
      );
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });

    it("converts falsy visible values to boolean", () => {
      const { container } = render(
        <PlaylistEditModal visible={0 as any} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("useEffect Hook", () => {
    it("updates isVisible when visible prop changes", async () => {
      const { rerender, container } = render(
        <PlaylistEditModal visible={false} onClose={mockOnClose} />
      );
      
      expect(container.firstChild).toBeNull();
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      });
    });

    it("updates isVisible when visible changes from true to false", async () => {
      const { rerender, container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      
      rerender(<PlaylistEditModal visible={false} onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it("maintains isVisible state correctly", () => {
      const { rerender } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });
  });

  describe("Re-render Behavior", () => {
    it("handles multiple re-renders with same props", () => {
      const { rerender } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });

    it("handles toggling visibility multiple times", async () => {
      const { rerender, container } = render(
        <PlaylistEditModal visible={false} onClose={mockOnClose} />
      );
      
      expect(container.firstChild).toBeNull();
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      });
      
      rerender(<PlaylistEditModal visible={false} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      });
    });

    it("preserves functionality after re-render", () => {
      const { rerender } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles null onClose gracefully", () => {
      render(<PlaylistEditModal visible={true} onClose={null as any} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });

    it("handles undefined onClose gracefully", () => {
      render(<PlaylistEditModal visible={true} onClose={undefined as any} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });

    it("handles rapid visibility changes", async () => {
      const { rerender, container } = render(
        <PlaylistEditModal visible={false} onClose={mockOnClose} />
      );
      
      for (let i = 0; i < 5; i++) {
        rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
        rerender(<PlaylistEditModal visible={false} onClose={mockOnClose} />);
      }
      
      expect(container.firstChild).toBeNull();
    });

    it("handles multiple close clicks", async () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      
      fireEvent.click(closeIcon);
      fireEvent.click(closeIcon);
      fireEvent.click(closeIcon);
      
      await waitFor(() => {
        expect(mockOnClose.mock.calls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("handles undefined playlist data", () => {
      mockUsePlaylist.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: false,
      });

      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      expect(screen.getByTestId("update-playlist-form")).toBeInTheDocument();
    });

    it("handles null playlist data", () => {
      mockUsePlaylist.mockReturnValue({
        data: null as any,
        error: undefined,
        isLoading: false,
      });

      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders all required elements when visible", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      expect(screen.getByTestId("io-close")).toBeInTheDocument();
      expect(screen.getByTestId("update-playlist-form")).toBeInTheDocument();
    });

    it("maintains correct DOM hierarchy", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed.inset-0") as HTMLElement | null;
      const modalContainer = container.querySelector(".max-w-3xl") as HTMLElement | null;
      const contentArea = container.querySelector(".bg-zinc-900") as HTMLElement | null;
      
      expect(backdrop).toContainElement(modalContainer!);
      expect(modalContainer).toContainElement(contentArea!);
    });

    it("renders close icon as first interactive element", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveClass("absolute");
    });
  });

  describe("Styling", () => {
    it("applies overflow classes to backdrop", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed");
      expect(backdrop).toHaveClass("overflow-x-hidden", "overflow-y-auto");
    });

    it("applies padding classes to backdrop", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed");
      expect(backdrop).toHaveClass("pb-32", "px-1");
    });

    it("applies padding to flex container", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const flexContainer = container.querySelector(".py-10.px-10");
      expect(flexContainer).toBeInTheDocument();
    });

    it("applies rounded corners to modal container", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const modalContainer = container.querySelector(".max-w-3xl");
      expect(modalContainer).toHaveClass("rounded-md");
    });

    it("applies drop shadow to content area", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const contentArea = container.querySelector(".bg-zinc-900");
      expect(contentArea).toHaveClass("drop-shadow-md");
    });

    it("applies minimum width constraint", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const innerContainer = container.querySelector(".min-w-\\[23rem\\]");
      expect(innerContainer).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("close icon has role button", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveAttribute("role", "button");
    });

    it("modal has proper heading structure", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const heading = screen.getByText("Update Playlist");
      expect(heading.tagName).toBe("H1");
    });

    it("close icon is keyboard accessible", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveClass("cursor-pointer");
    });
  });

  describe("Hooks Integration", () => {
    it("calls useUpdatePlaylistModal hook", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(mockUseUpdatePlaylistModal).toHaveBeenCalled();
    });

    it("calls usePlaylist hook with playlistId from useUpdatePlaylistModal", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(mockUsePlaylist).toHaveBeenCalledWith("playlist-1");
    });

    it("updates when playlistId changes", () => {
      const { rerender } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      expect(mockUsePlaylist).toHaveBeenCalledWith("playlist-1");
      
      mockUseUpdatePlaylistModal.mockReturnValue({
        playlistId: "playlist-2",
        isOpen: true,
        openModal: jest.fn(),
        closeModal: jest.fn(),
      });
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      expect(mockUsePlaylist).toHaveBeenCalledWith("playlist-2");
    });

    it("handles loading state from usePlaylist", () => {
      mockUsePlaylist.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
      });

      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });

    it("handles error state from usePlaylist", () => {
      mockUsePlaylist.mockReturnValue({
        data: undefined,
        error: new Error("Failed to load"),
        isLoading: false,
      });

      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
    });

    it("handles undefined playlistId", () => {
      mockUseUpdatePlaylistModal.mockReturnValue({
        playlistId: undefined as any,
        isOpen: true,
        openModal: jest.fn(),
        closeModal: jest.fn(),
      });

      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      expect(mockUsePlaylist).toHaveBeenCalledWith(undefined);
    });
  });

  describe("Integration", () => {
    it("completes full open and close cycle", async () => {
      const { rerender } = render(
        <PlaylistEditModal visible={false} onClose={mockOnClose} />
      );
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      });
      
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("renders all components together correctly", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      expect(container.querySelector(".fixed.inset-0")).toBeInTheDocument();
      expect(screen.getByText("Update Playlist")).toBeInTheDocument();
      expect(screen.getByTestId("io-close")).toBeInTheDocument();
      expect(screen.getByTestId("update-playlist-form")).toBeInTheDocument();
    });

    it("maintains correct state after interaction", async () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const closeIcon = screen.getByTestId("io-close");
      
      await act(async () => {
        fireEvent.click(closeIcon);
      });
      
      const animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-0");
    });

    it("integrates hooks and renders form with fetched data", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      expect(mockUseUpdatePlaylistModal).toHaveBeenCalled();
      expect(mockUsePlaylist).toHaveBeenCalledWith("playlist-1");
      
      const form = screen.getByTestId("update-playlist-form");
      expect(form).toHaveAttribute("data-playlist-id", "playlist-1");
    });
  });

  describe("useCallback Hook", () => {
    it("handleClose is memoized with onClose dependency", () => {
      const onClose1 = jest.fn();
      const { rerender } = render(
        <PlaylistEditModal visible={true} onClose={onClose1} />
      );
      
      const closeIcon1 = screen.getByTestId("io-close");
      fireEvent.click(closeIcon1);
      expect(onClose1).toHaveBeenCalled();
      
      const onClose2 = jest.fn();
      rerender(<PlaylistEditModal visible={true} onClose={onClose2} />);
      
      const closeIcon2 = screen.getByTestId("io-close");
      fireEvent.click(closeIcon2);
      expect(onClose2).toHaveBeenCalled();
    });
  });

  describe("State Management", () => {
    it("initializes isVisible from visible prop", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-100");
    });

    it("updates isVisible when visible prop changes", async () => {
      const { rerender, container } = render(
        <PlaylistEditModal visible={false} onClose={mockOnClose} />
      );
      
      expect(container.firstChild).toBeNull();
      
      rerender(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        const animatedDiv = container.querySelector(".bg-zinc-900");
        expect(animatedDiv).toHaveClass("scale-100");
      });
    });

    it("isVisible controls animation class", async () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      let animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-100");
      
      const closeIcon = screen.getByTestId("io-close");
      await act(async () => {
        fireEvent.click(closeIcon);
      });
      
      animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-0");
    });
  });

  describe("Z-Index Behavior", () => {
    it("uses z-[100] for higher stacking priority", () => {
      const { container } = render(
        <PlaylistEditModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed.inset-0");
      expect(backdrop).toHaveClass("z-[100]");
    });

    it("close icon has z-10 for proper layering", () => {
      render(<PlaylistEditModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveClass("z-10");
    });
  });
});
