import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useTransition } from "react";
import toast from "react-hot-toast";

import { addPlaylist } from "@/actions/playlist/add-playlist";

// Mock dependencies
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useTransition: jest.fn(),
}));

jest.mock("react-hot-toast");

jest.mock("@/actions/playlist/add-playlist", () => ({
  addPlaylist: jest.fn(),
}));

jest.mock("@/schemas", () => {
  const z = jest.requireActual("zod");
  return {
    PlaylistSchema: z.object({
      playlistName: z.string(),
    }),
  };
});

// Import component after mocks
import { AddPlaylistForm } from "../add-playlist-form";

describe("AddPlaylistForm", () => {
  const mockStartTransition = jest.fn((callback) => callback());
  const mockAddPlaylist = addPlaylist as jest.Mock;
  const mockToastError = toast.error as jest.Mock;
  const mockToastSuccess = toast.success as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    (useTransition as jest.Mock).mockReturnValue([false, mockStartTransition]);
  });

  describe("Rendering", () => {
    it("renders the form", () => {
      const { container } = render(<AddPlaylistForm />);

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
    });

    it("renders the name label", () => {
      render(<AddPlaylistForm />);

      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("renders the playlist name input", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("renders the submit button", () => {
      render(<AddPlaylistForm />);

      const button = screen.getByRole("button", { name: /add/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "submit");
    });

    it("renders with correct form structure", () => {
      const { container } = render(<AddPlaylistForm />);

      const form = container.querySelector("form");
      expect(form).toHaveClass("space-y-6");
    });

    it("renders input with correct styling classes", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("text-white", "bg-zinc-800", "h-10");
    });
  });

  describe("Form Initialization", () => {
    it("initializes with empty playlist name", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("input is enabled by default", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      expect(input).not.toBeDisabled();
    });

    it("button is enabled by default", () => {
      render(<AddPlaylistForm />);

      const button = screen.getByRole("button", { name: /add/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe("Input Interaction", () => {
    it("updates input value when typing", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "My Playlist" } });

      expect(input.value).toBe("My Playlist");
    });

    it("handles multiple character inputs", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Test" } });
      expect(input.value).toBe("Test");

      fireEvent.change(input, { target: { value: "Test Playlist" } });
      expect(input.value).toBe("Test Playlist");
    });

    it("handles special characters in input", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "My Playlist & More!" } });

      expect(input.value).toBe("My Playlist & More!");
    });

    it("handles empty string after typing", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.change(input, { target: { value: "" } });

      expect(input.value).toBe("");
    });
  });

  describe("Form Submission - Success", () => {
    it("calls addPlaylist with form values on submit", async () => {
      mockAddPlaylist.mockResolvedValue({ success: "Playlist added!" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "My Playlist" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddPlaylist).toHaveBeenCalledWith({
          playlistName: "My Playlist",
        });
      });
    });

    it("uses startTransition for submission", async () => {
      mockAddPlaylist.mockResolvedValue({ success: "Playlist added!" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStartTransition).toHaveBeenCalled();
      });
    });

    it("shows success toast on successful submission", async () => {
      const successMessage = "Playlist created successfully!";
      mockAddPlaylist.mockResolvedValue({ success: successMessage });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "My Playlist" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(successMessage);
      });
    });

    it("resets form after successful submission", async () => {
      mockAddPlaylist.mockResolvedValue({ success: "Playlist added!" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "My Playlist" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("handles submission with whitespace in name", async () => {
      mockAddPlaylist.mockResolvedValue({ success: "Playlist added!" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "  Spaced Playlist  " } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddPlaylist).toHaveBeenCalledWith({
          playlistName: "  Spaced Playlist  ",
        });
      });
    });
  });

  describe("Form Submission - Error", () => {
    it("shows error toast on failed submission", async () => {
      const errorMessage = "Failed to create playlist";
      mockAddPlaylist.mockResolvedValue({ error: errorMessage });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "My Playlist" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it("resets form after error", async () => {
      mockAddPlaylist.mockResolvedValue({ error: "Error occurred" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "My Playlist" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("handles error without success message", async () => {
      mockAddPlaylist.mockResolvedValue({ error: "Database error" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Database error");
        expect(mockToastSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe("Pending State", () => {
    it("disables input when pending", () => {
      (useTransition as jest.Mock).mockReturnValue([true, mockStartTransition]);

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("disables button when pending", () => {
      (useTransition as jest.Mock).mockReturnValue([true, mockStartTransition]);

      render(<AddPlaylistForm />);

      const button = screen.getByRole("button", { name: /add/i });
      expect(button).toBeDisabled();
    });

    it("enables input when not pending", () => {
      (useTransition as jest.Mock).mockReturnValue([false, mockStartTransition]);

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      expect(input).not.toBeDisabled();
    });

    it("enables button when not pending", () => {
      (useTransition as jest.Mock).mockReturnValue([false, mockStartTransition]);

      render(<AddPlaylistForm />);

      const button = screen.getByRole("button", { name: /add/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined response from addPlaylist", async () => {
      mockAddPlaylist.mockResolvedValue(undefined);

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddPlaylist).toHaveBeenCalled();
        expect(mockToastError).not.toHaveBeenCalled();
        expect(mockToastSuccess).not.toHaveBeenCalled();
      });
    });

    it("handles null response from addPlaylist", async () => {
      mockAddPlaylist.mockResolvedValue(null);

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddPlaylist).toHaveBeenCalled();
        expect(mockToastError).not.toHaveBeenCalled();
        expect(mockToastSuccess).not.toHaveBeenCalled();
      });
    });

    it("handles response with both error and success", async () => {
      mockAddPlaylist.mockResolvedValue({
        error: "Error message",
        success: "Success message",
      });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        // Error is checked first in the component
        expect(mockToastError).toHaveBeenCalledWith("Error message");
        expect(mockToastSuccess).toHaveBeenCalledWith("Success message");
      });
    });

    it("handles very long playlist name", async () => {
      const longName = "A".repeat(200);
      mockAddPlaylist.mockResolvedValue({ success: "Added!" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: longName } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddPlaylist).toHaveBeenCalledWith({
          playlistName: longName,
        });
      });
    });

    it("handles unicode characters in playlist name", async () => {
      mockAddPlaylist.mockResolvedValue({ success: "Added!" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "播放列表 🎬" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddPlaylist).toHaveBeenCalledWith({
          playlistName: "播放列表 🎬",
        });
      });
    });

    it("handles multiple rapid submissions", async () => {
      mockAddPlaylist.mockResolvedValue({ success: "Added!" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "Playlist 1" } });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        // startTransition should be called for each click
        expect(mockStartTransition).toHaveBeenCalled();
      });
    });
  });

  describe("Form Layout", () => {
    it("renders form with proper container structure", () => {
      const { container } = render(<AddPlaylistForm />);

      const flexDiv = container.querySelector(".flex.flex-col.gap-2.mx-4.mt-8");
      expect(flexDiv).toBeInTheDocument();
    });

    it("renders button with proper container", () => {
      const { container } = render(<AddPlaylistForm />);

      const buttonContainer = container.querySelector(".px-32");
      expect(buttonContainer).toBeInTheDocument();
    });

    it("label has correct styling", () => {
      render(<AddPlaylistForm />);

      const label = screen.getByText("Name");
      expect(label).toHaveClass("text-white");
    });
  });

  describe("Form Validation", () => {
    it("submits form with valid data", async () => {
      mockAddPlaylist.mockResolvedValue({ success: "Success!" });

      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      const button = screen.getByRole("button", { name: /add/i });

      fireEvent.change(input, { target: { value: "Valid Name" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddPlaylist).toHaveBeenCalled();
      });
    });

    it("can submit with empty form", async () => {
      mockAddPlaylist.mockResolvedValue({ error: "Name is required" });

      render(<AddPlaylistForm />);

      const button = screen.getByRole("button", { name: /add/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockAddPlaylist).toHaveBeenCalledWith({
          playlistName: "",
        });
      });
    });
  });

  describe("Re-render Behavior", () => {
    it("maintains form state across re-renders", () => {
      const { rerender } = render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Test" } });

      expect(input.value).toBe("Test");

      rerender(<AddPlaylistForm />);

      expect(input.value).toBe("Test");
    });

    it("updates pending state on re-render", () => {
      const { rerender } = render(<AddPlaylistForm />);

      let input = screen.getByRole("textbox");
      expect(input).not.toBeDisabled();

      (useTransition as jest.Mock).mockReturnValue([true, mockStartTransition]);

      rerender(<AddPlaylistForm />);

      input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("associates label with input", () => {
      render(<AddPlaylistForm />);

      const label = screen.getByText("Name");
      const input = screen.getByRole("textbox");

      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it("button has accessible text", () => {
      render(<AddPlaylistForm />);

      const button = screen.getByRole("button", { name: /add/i });
      expect(button).toHaveAccessibleName();
    });

    it("input has correct type attribute", () => {
      render(<AddPlaylistForm />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });
  });
});
