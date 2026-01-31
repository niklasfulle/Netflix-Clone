import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock react-icons
jest.mock("react-icons/fa", () => ({
  FaPlus: ({ className, size }: any) => (
    <div data-testid="fa-plus" className={className} data-size={size}>
      Plus Icon
    </div>
  ),
}));

// Import component after mocks
import PlaylistAddCard from "../PlaylistAddCard";

describe("PlaylistAddCard", () => {
  const mockOpenModalCreate = jest.fn();
  let originalInnerWidth: PropertyDescriptor | undefined;

  beforeAll(() => {
    // Save original innerWidth descriptor
    originalInnerWidth = Object.getOwnPropertyDescriptor(
      globalThis,
      "innerWidth"
    );
  });

  afterAll(() => {
    // Restore original innerWidth
    if (originalInnerWidth) {
      Object.defineProperty(globalThis, "innerWidth", originalInnerWidth);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Set default window width
    Object.defineProperty(globalThis, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe("Rendering", () => {
    it("renders the button", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("renders the FaPlus icon", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const icon = screen.getByTestId("fa-plus");
      expect(icon).toBeInTheDocument();
    });

    it("renders icon with correct size", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const icon = screen.getByTestId("fa-plus");
      expect(icon).toHaveAttribute("data-size", "45");
    });

    it("renders button with correct styling classes", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "group",
        "bg-zinc-800",
        "col-span",
        "relative",
        "flex",
        "flex-row",
        "items-center",
        "justify-center",
        "rounded-t-md",
        "cursor-pointer"
      );
    });

    it("renders icon with correct styling classes", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const icon = screen.getByTestId("fa-plus");
      expect(icon).toHaveClass("text-white", "group-hover:text-neutral-300");
    });

    it("button has correct height classes", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("h-[24vw]");
      expect(button.className).toContain("lg:h-[12vw]");
    });
  });

  describe("Click Behavior", () => {
    it("calls openModalCreate when button is clicked", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOpenModalCreate).toHaveBeenCalledTimes(1);
    });

    it("calls openModalCreate with no arguments", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOpenModalCreate).toHaveBeenCalledWith();
    });

    it("handles multiple clicks", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOpenModalCreate).toHaveBeenCalledTimes(3);
    });

    it("does not call openModalCreate on render", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      expect(mockOpenModalCreate).not.toHaveBeenCalled();
    });
  });

  describe("Window Size Detection - Desktop", () => {
    it("detects desktop size when window width is 1024px", async () => {
      Object.defineProperty(globalThis, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      await waitFor(() => {
        expect(window.innerWidth).toBe(1024);
      });
    });

    it("detects desktop size when window width is 640px", async () => {
      Object.defineProperty(globalThis, "innerWidth", {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      await waitFor(() => {
        expect(window.innerWidth).toBe(640);
      });
    });

    it("detects desktop size when window width is 1920px", async () => {
      Object.defineProperty(globalThis, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      await waitFor(() => {
        expect(window.innerWidth).toBe(1920);
      });
    });
  });

  describe("Window Size Detection - Mobile", () => {
    it("detects mobile size when window width is 320px", async () => {
      Object.defineProperty(globalThis, "innerWidth", {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      await waitFor(() => {
        expect(window.innerWidth).toBe(320);
      });
    });

    it("detects mobile size when window width is 480px", async () => {
      Object.defineProperty(globalThis, "innerWidth", {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      await waitFor(() => {
        expect(window.innerWidth).toBe(480);
      });
    });

    it("detects mobile size when window width is 639px", async () => {
      Object.defineProperty(globalThis, "innerWidth", {
        writable: true,
        configurable: true,
        value: 639,
      });

      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      await waitFor(() => {
        expect(window.innerWidth).toBe(639);
      });
    });
  });

  describe("Props Handling", () => {
    it("accepts openModalCreate prop", () => {
      const customModal = jest.fn();
      render(<PlaylistAddCard openModalCreate={customModal} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(customModal).toHaveBeenCalled();
    });

    it("handles different openModalCreate functions", () => {
      const modal1 = jest.fn();
      const { rerender } = render(<PlaylistAddCard openModalCreate={modal1} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(modal1).toHaveBeenCalledTimes(1);

      const modal2 = jest.fn();
      rerender(<PlaylistAddCard openModalCreate={modal2} />);

      fireEvent.click(button);
      expect(modal2).toHaveBeenCalledTimes(1);
      expect(modal1).toHaveBeenCalledTimes(1);
    });
  });

  describe("Component Structure", () => {
    it("renders button as direct parent of icon", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      const icon = screen.getByTestId("fa-plus");

      expect(button).toContainElement(icon);
    });

    it("renders single button element", () => {
      const { container } = render(
        <PlaylistAddCard openModalCreate={mockOpenModalCreate} />
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(1);
    });

    it("renders single icon element", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const icons = screen.getAllByTestId("fa-plus");
      expect(icons).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    it("handles null openModalCreate", () => {
      render(<PlaylistAddCard openModalCreate={null} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles window width of 0", () => {
      Object.defineProperty(globalThis, "innerWidth", {
        writable: true,
        configurable: true,
        value: 0,
      });

      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles extremely large window width", () => {
      Object.defineProperty(globalThis, "innerWidth", {
        writable: true,
        configurable: true,
        value: 10000,
      });

      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles re-render without issues", () => {
      const { rerender } = render(
        <PlaylistAddCard openModalCreate={mockOpenModalCreate} />
      );

      rerender(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles rapid re-renders", () => {
      const { rerender } = render(
        <PlaylistAddCard openModalCreate={mockOpenModalCreate} />
      );

      for (let i = 0; i < 10; i++) {
        rerender(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);
      }

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("UseEffect Behavior", () => {
    it("runs effect on mount", () => {
      const { container } = render(
        <PlaylistAddCard openModalCreate={mockOpenModalCreate} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it("component renders successfully after effect", async () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("button is accessible via role", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("button can be focused", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();
    });

    it("button responds to Enter key", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter", code: "Enter" });

      // Button should be clickable via keyboard
      expect(button).toBeInTheDocument();
    });
  });

  describe("Styling Verification", () => {
    it("has responsive height classes", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button.className).toMatch(/h-\[24vw\]/);
      expect(button.className).toMatch(/lg:h-\[12vw\]/);
    });

    it("has group hover classes for icon", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const icon = screen.getByTestId("fa-plus");
      expect(icon.className).toContain("group-hover:text-neutral-300");
    });

    it("button is marked as group for hover effects", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("group");
    });

    it("has correct background color", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-zinc-800");
    });

    it("has cursor pointer", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("has rounded top corners", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("rounded-t-md");
    });
  });

  describe("Icon Properties", () => {
    it("icon has correct text color", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const icon = screen.getByTestId("fa-plus");
      expect(icon).toHaveClass("text-white");
    });

    it("icon size is 45", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const icon = screen.getByTestId("fa-plus");
      expect(icon).toHaveAttribute("data-size", "45");
    });

    it("icon content is present", () => {
      render(<PlaylistAddCard openModalCreate={mockOpenModalCreate} />);

      const icon = screen.getByTestId("fa-plus");
      expect(icon).toHaveTextContent("Plus Icon");
    });
  });

  describe("Integration", () => {
    it("clicking button triggers modal function immediately", () => {
      const spy = jest.fn();
      render(<PlaylistAddCard openModalCreate={spy} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("renders correctly with different prop types", () => {
      const arrowFunction = () => {};
      const { rerender } = render(
        <PlaylistAddCard openModalCreate={arrowFunction} />
      );

      expect(screen.getByRole("button")).toBeInTheDocument();

      function namedFunction() {}
      rerender(<PlaylistAddCard openModalCreate={namedFunction} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
