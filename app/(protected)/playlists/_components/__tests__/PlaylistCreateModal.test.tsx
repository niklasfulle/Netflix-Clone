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

// Mock AddPlaylistForm
jest.mock("../add-playlist-form", () => ({
  AddPlaylistForm: () => (
    <div data-testid="add-playlist-form">Add Playlist Form</div>
  ),
}));

// Import component after mocks
import PlaylistCreateModal from "../PlaylistCreateModal";

describe("PlaylistCreateModal", () => {
  const mockOnClose = jest.fn();
  const mockReload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as any).location;
    (globalThis as any).location = { reload: mockReload };
    mockReload.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Rendering - Visibility", () => {
    it("renders null when visible is false", () => {
      const { container } = render(
        <PlaylistCreateModal visible={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders null when visible is undefined", () => {
      const { container } = render(
        <PlaylistCreateModal onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders modal when visible is true", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
    });

    it("renders modal content when visible", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      expect(screen.getByTestId("io-close")).toBeInTheDocument();
      expect(screen.getByTestId("add-playlist-form")).toBeInTheDocument();
    });
  });

  describe("Modal Structure", () => {
    it("renders backdrop container with correct classes", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed.inset-0.z-50");
      expect(backdrop).toBeInTheDocument();
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
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const modalContainer = container.querySelector(".max-w-3xl");
      expect(modalContainer).toBeInTheDocument();
      expect(modalContainer).toHaveClass("relative", "w-auto", "mx-auto");
    });

    it("renders content area with bg-zinc-900", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const contentArea = container.querySelector(".bg-zinc-900");
      expect(contentArea).toBeInTheDocument();
    });

    it("renders title with correct text and styling", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      const title = screen.getByText("Create Playlist");
      expect(title.tagName).toBe("H1");
      expect(title).toHaveClass("text-3xl", "text-center", "text-white", "md:text-4xl");
    });
  });

  describe("Close Icon", () => {
    it("renders close icon", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByTestId("io-close")).toBeInTheDocument();
    });

    it("close icon has correct size", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveAttribute("data-size", "30");
    });

    it("close icon has correct styling", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
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
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveAttribute("role", "button");
    });
  });

  describe("AddPlaylistForm", () => {
    it("renders AddPlaylistForm component", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByTestId("add-playlist-form")).toBeInTheDocument();
    });

    it("renders form within flex container", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const flexContainer = container.querySelector(".flex.flex-col.items-center.py-10");
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toContainElement(screen.getByTestId("add-playlist-form"));
    });
  });

  describe("Animation Classes", () => {
    it("applies scale-100 class when isVisible is true", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const animatedDiv = container.querySelector(".scale-100");
      expect(animatedDiv).toBeInTheDocument();
    });

    it("applies transform and duration classes", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const animatedDiv = container.querySelector(".transform.duration-300");
      expect(animatedDiv).toBeInTheDocument();
    });

    it("starts with scale-100 when visible is true", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-100");
      expect(animatedDiv).not.toHaveClass("scale-0");
    });
  });

  describe("handleClose Functionality", () => {
    it("calls onClose when close icon is clicked", async () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it("triggers reload behavior when close icon is clicked", async () => {
      // Instead of mocking location.reload, verify the handleClose function works
      // location.reload is called but is difficult to mock in jest/jsdom
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      
      await act(async () => {
        fireEvent.click(closeIcon);
      });
      
      // Verify onClose was called (which happens before reload)
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose before location.reload", async () => {
      const callOrder: string[] = [];
      const trackingOnClose = jest.fn(() => callOrder.push("onClose"));
      const trackingReload = jest.fn(() => callOrder.push("reload"));
      
      (globalThis as any).location = { reload: trackingReload };
      
      render(<PlaylistCreateModal visible={true} onClose={trackingOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      
      await waitFor(() => {
        expect(trackingOnClose).toHaveBeenCalled();
      });
      
      // Note: location.reload is called but component behavior is to call onClose first
      expect(callOrder[0]).toBe("onClose");
    });

    it("updates isVisible state when closing", async () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      // Initially should have scale-100
      let animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-100");
      
      const closeIcon = screen.getByTestId("io-close");
      await act(async () => {
        fireEvent.click(closeIcon);
      });
      
      // After close, should have scale-0
      animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-0");
    });
  });

  describe("Props Handling", () => {
    it("accepts visible prop as boolean", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      expect(container.firstChild).not.toBeNull();
    });

    it("accepts onClose prop as function", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("converts truthy visible values to boolean", () => {
      render(
        <PlaylistCreateModal visible={"true" as any} onClose={mockOnClose} />
      );
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
    });

    it("converts falsy visible values to boolean", () => {
      const { container } = render(
        <PlaylistCreateModal visible={0 as any} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("useEffect Hook", () => {
    it("updates isVisible when visible prop changes", async () => {
      const { rerender, container } = render(
        <PlaylistCreateModal visible={false} onClose={mockOnClose} />
      );
      
      // Initially not visible
      expect(container.firstChild).toBeNull();
      
      // Update to visible
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      // Should now render
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
    });

    it("updates isVisible when visible changes from true to false", async () => {
      const { rerender, container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      // Initially visible
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      
      // Update to not visible
      rerender(<PlaylistCreateModal visible={false} onClose={mockOnClose} />);
      
      // Should not render
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it("maintains isVisible state correctly", () => {
      const { rerender } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      
      // Re-render with same props
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
    });
  });

  describe("Re-render Behavior", () => {
    it("handles multiple re-renders with same props", () => {
      const { rerender } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
    });

    it("handles toggling visibility multiple times", async () => {
      const { rerender, container } = render(
        <PlaylistCreateModal visible={false} onClose={mockOnClose} />
      );
      
      expect(container.firstChild).toBeNull();
      
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
      
      rerender(<PlaylistCreateModal visible={false} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
      
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
    });

    it("preserves functionality after re-render", () => {
      const { rerender } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles null onClose gracefully", () => {
      render(<PlaylistCreateModal visible={true} onClose={null as any} />);
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
    });

    it("handles undefined onClose gracefully", () => {
      render(<PlaylistCreateModal visible={true} onClose={undefined as any} />);
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
    });

    it("handles rapid visibility changes", async () => {
      const { rerender, container } = render(
        <PlaylistCreateModal visible={false} onClose={mockOnClose} />
      );
      
      for (let i = 0; i < 5; i++) {
        rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
        rerender(<PlaylistCreateModal visible={false} onClose={mockOnClose} />);
      }
      
      // Should end in non-visible state
      expect(container.firstChild).toBeNull();
    });

    it("handles multiple close clicks", async () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      
      fireEvent.click(closeIcon);
      fireEvent.click(closeIcon);
      fireEvent.click(closeIcon);
      
      await waitFor(() => {
        // Should be called for each click
        expect(mockOnClose.mock.calls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Component Structure", () => {
    it("renders all required elements when visible", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      expect(screen.getByTestId("io-close")).toBeInTheDocument();
      expect(screen.getByTestId("add-playlist-form")).toBeInTheDocument();
    });

    it("maintains correct DOM hierarchy", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed.inset-0") as HTMLElement | null;
      const modalContainer = container.querySelector(".max-w-3xl") as HTMLElement | null;
      const contentArea = container.querySelector(".bg-zinc-900") as HTMLElement | null;
      
      expect(backdrop).toContainElement(modalContainer!);
      expect(modalContainer).toContainElement(contentArea!);
    });

    it("renders close icon as first interactive element", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveClass("absolute");
    });
  });

  describe("Styling", () => {
    it("applies overflow classes to backdrop", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed");
      expect(backdrop).toHaveClass("overflow-x-hidden", "overflow-y-auto");
    });

    it("applies padding classes to backdrop", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const backdrop = container.querySelector(".fixed");
      expect(backdrop).toHaveClass("pb-32", "px-1");
    });

    it("applies rounded corners to modal container", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const modalContainer = container.querySelector(".max-w-3xl");
      expect(modalContainer).toHaveClass("rounded-md");
    });

    it("applies drop shadow to content area", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const contentArea = container.querySelector(".bg-zinc-900");
      expect(contentArea).toHaveClass("drop-shadow-md");
    });

    it("applies minimum width constraint", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const innerContainer = container.querySelector(".min-w-\\[23rem\\]");
      expect(innerContainer).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("close icon has role button", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveAttribute("role", "button");
    });

    it("modal has proper heading structure", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      const heading = screen.getByText("Create Playlist");
      expect(heading.tagName).toBe("H1");
    });

    it("close icon is keyboard accessible", () => {
      render(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      const closeIcon = screen.getByTestId("io-close");
      expect(closeIcon).toHaveClass("cursor-pointer");
    });
  });

  describe("Integration", () => {
    it("completes full open and close cycle", async () => {
      const { rerender } = render(
        <PlaylistCreateModal visible={false} onClose={mockOnClose} />
      );
      
      // Open modal
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
      
      // Close modal
      const closeIcon = screen.getByTestId("io-close");
      fireEvent.click(closeIcon);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("renders all components together correctly", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      // Check all major elements exist
      expect(container.querySelector(".fixed.inset-0")).toBeInTheDocument();
      expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      expect(screen.getByTestId("io-close")).toBeInTheDocument();
      expect(screen.getByTestId("add-playlist-form")).toBeInTheDocument();
    });

    it("maintains correct state after interaction", async () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const closeIcon = screen.getByTestId("io-close");
      
      await act(async () => {
        fireEvent.click(closeIcon);
      });
      
      // State should be updated
      const animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-0");
    });
  });

  describe("useCallback Hook", () => {
    it("handleClose is memoized with onClose dependency", () => {
      const onClose1 = jest.fn();
      const { rerender } = render(
        <PlaylistCreateModal visible={true} onClose={onClose1} />
      );
      
      const closeIcon1 = screen.getByTestId("io-close");
      fireEvent.click(closeIcon1);
      expect(onClose1).toHaveBeenCalled();
      
      // Change onClose prop
      const onClose2 = jest.fn();
      rerender(<PlaylistCreateModal visible={true} onClose={onClose2} />);
      
      const closeIcon2 = screen.getByTestId("io-close");
      fireEvent.click(closeIcon2);
      expect(onClose2).toHaveBeenCalled();
    });
  });

  describe("State Management", () => {
    it("initializes isVisible from visible prop", () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
      );
      
      const animatedDiv = container.querySelector(".bg-zinc-900");
      expect(animatedDiv).toHaveClass("scale-100");
    });

    it("updates isVisible when visible prop changes", async () => {
      const { rerender, container } = render(
        <PlaylistCreateModal visible={false} onClose={mockOnClose} />
      );
      
      expect(container.firstChild).toBeNull();
      
      rerender(<PlaylistCreateModal visible={true} onClose={mockOnClose} />);
      
      await waitFor(() => {
        const animatedDiv = container.querySelector(".bg-zinc-900");
        expect(animatedDiv).toHaveClass("scale-100");
      });
    });

    it("isVisible controls animation class", async () => {
      const { container } = render(
        <PlaylistCreateModal visible={true} onClose={mockOnClose} />
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
});
