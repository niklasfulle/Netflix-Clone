import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserBlockButton from "../UserBlockButton";

// Mock fetch
globalThis.fetch = jest.fn();

describe("UserBlockButton Component", () => {
  const mockOnChange = jest.fn();
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render button element", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should be enabled by default", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  describe("Button Text", () => {
    it("should show Sperren when user is not blocked", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      expect(screen.getByText("Sperren")).toBeInTheDocument();
    });

    it("should show Entsperren when user is blocked", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={true} onChange={mockOnChange} />);
      expect(screen.getByText("Entsperren")).toBeInTheDocument();
    });

    it("should not show both texts simultaneously", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      expect(screen.getByText("Sperren")).toBeInTheDocument();
      expect(screen.queryByText("Entsperren")).not.toBeInTheDocument();
    });
  });

  describe("Button Styling", () => {
    it("should have red background when user is not blocked", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-red-600");
      expect(button).toHaveClass("hover:bg-red-800");
    });

    it("should have green background when user is blocked", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={true} onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-green-600");
      expect(button).toHaveClass("hover:bg-green-800");
    });

    it("should have common styling classes", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
      expect(button).toHaveClass("rounded-md");
      expect(button).toHaveClass("text-white");
      expect(button).toHaveClass("font-semibold");
    });

    it("should have focus ring styling", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:ring-2");
      expect(button).toHaveClass("focus:ring-red-600");
    });

    it("should have transition styling", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-all");
    });

    it("should have shadow styling", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("shadow-sm");
    });
  });

  describe("Click Handling - Block User", () => {
    it("should call fetch with correct URL when blocking", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/admin/users/block",
          expect.any(Object)
        );
      });
    });

    it("should use POST method when blocking", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    it("should send correct headers when blocking", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { "Content-Type": "application/json" }
          })
        );
      });
    });

    it("should send correct body when blocking", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ userId: mockUserId, block: true })
          })
        );
      });
    });

    it("should call onChange with true when blocking succeeds", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("Click Handling - Unblock User", () => {
    it("should call fetch when unblocking", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={true} onChange={mockOnChange} />);
      const button = screen.getByText("Entsperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });

    it("should send correct body when unblocking", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={true} onChange={mockOnChange} />);
      const button = screen.getByText("Entsperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ userId: mockUserId, block: false })
          })
        );
      });
    });

    it("should call onChange with false when unblocking succeeds", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={true} onChange={mockOnChange} />);
      const button = screen.getByText("Entsperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Loading State", () => {
    it("should disable button during loading", async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (globalThis.fetch as jest.Mock).mockReturnValue(fetchPromise);

      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      resolvePromise!({ ok: true, json: async () => ({}) });
    });

    it("should re-enable button after successful request", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it("should re-enable button after failed request", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it("should initialize loading as false", () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should not call onChange when request fails", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should not call onChange with status code 404", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should not call onChange with status code 500", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Props Handling", () => {
    it("should use provided userId in request", async () => {
      const customUserId = "custom-user-456";
      render(<UserBlockButton userId={customUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ userId: customUserId, block: true })
          })
        );
      });
    });

    it("should handle isBlocked prop changes", () => {
      const { rerender } = render(
        <UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />
      );
      expect(screen.getByText("Sperren")).toBeInTheDocument();

      rerender(<UserBlockButton userId={mockUserId} isBlocked={true} onChange={mockOnChange} />);
      expect(screen.getByText("Entsperren")).toBeInTheDocument();
    });

    it("should call different onChange callbacks", async () => {
      const firstOnChange = jest.fn();
      const { rerender } = render(
        <UserBlockButton userId={mockUserId} isBlocked={false} onChange={firstOnChange} />
      );
      
      fireEvent.click(screen.getByText("Sperren"));

      await waitFor(() => {
        expect(firstOnChange).toHaveBeenCalledWith(true);
      });

      const secondOnChange = jest.fn();
      rerender(<UserBlockButton userId={mockUserId} isBlocked={true} onChange={secondOnChange} />);
      
      fireEvent.click(screen.getByText("Entsperren"));

      await waitFor(() => {
        expect(secondOnChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Multiple Clicks", () => {
    it("should prevent multiple simultaneous requests", async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (globalThis.fetch as jest.Mock).mockReturnValue(fetchPromise);

      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      resolvePromise!({ ok: true, json: async () => ({}) });
    });

    it("should allow clicks after request completes", async () => {
      render(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty userId", async () => {
      render(<UserBlockButton userId="" isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ userId: "", block: true })
          })
        );
      });
    });

    it("should handle special characters in userId", async () => {
      const specialUserId = "user@#$%^&*()_+";
      render(<UserBlockButton userId={specialUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ userId: specialUserId, block: true })
          })
        );
      });
    });

    it("should handle very long userId", async () => {
      const longUserId = "a".repeat(1000);
      render(<UserBlockButton userId={longUserId} isBlocked={false} onChange={mockOnChange} />);
      const button = screen.getByText("Sperren");
      
      fireEvent.click(button);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ userId: longUserId, block: true })
          })
        );
      });
    });
  });

  describe("Readonly Props", () => {
    it("should accept readonly props", () => {
      const props = {
        userId: mockUserId,
        isBlocked: false,
        onChange: mockOnChange,
      } as const;

      expect(() => render(<UserBlockButton {...props} />)).not.toThrow();
    });
  });

  describe("Component Integration", () => {
    it("should work in complete flow: block then unblock", async () => {
      const { rerender } = render(
        <UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />
      );

      // Block user
      fireEvent.click(screen.getByText("Sperren"));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
      });

      // Rerender with blocked state
      rerender(<UserBlockButton userId={mockUserId} isBlocked={true} onChange={mockOnChange} />);

      // Unblock user
      fireEvent.click(screen.getByText("Entsperren"));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(false);
      });

      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });

    it("should maintain button state across renders", () => {
      const { rerender } = render(
        <UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />
      );

      expect(screen.getByText("Sperren")).toBeInTheDocument();

      rerender(<UserBlockButton userId={mockUserId} isBlocked={false} onChange={mockOnChange} />);

      expect(screen.getByText("Sperren")).toBeInTheDocument();
    });
  });
});
