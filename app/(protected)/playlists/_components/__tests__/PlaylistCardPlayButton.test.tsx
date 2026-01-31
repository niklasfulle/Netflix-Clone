import React from "react";
import { render, screen } from "@testing-library/react";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href, className }: any) => {
    return (
      <a href={href} className={className} data-testid="mock-link">
        {children}
      </a>
    );
  };
});

// Mock react-icons
jest.mock("react-icons/fa", () => ({
  FaPlay: ({ size, className }: any) => (
    <div data-testid="fa-play" data-size={size} className={className}>
      Play Icon
    </div>
  ),
}));

// Import component after mocks
import PlaylistCardPlayButton from "../PlaylistCardPlayButton";

describe("PlaylistCardPlayButton", () => {
  const mockMovieId = "movie-123";

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      expect(screen.getByTestId("mock-link")).toBeInTheDocument();
    });

    it("renders the play icon", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      expect(screen.getByTestId("fa-play")).toBeInTheDocument();
    });

    it("renders the play text", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      expect(screen.getByText("Play")).toBeInTheDocument();
    });

    it("renders play icon with correct size", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId("fa-play");
      expect(icon).toHaveAttribute("data-size", "20");
    });
  });

  describe("Link Navigation", () => {
    it("creates correct href with movieId", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href", "/watch/movie-123");
    });

    it("creates correct href with different movieId", () => {
      render(<PlaylistCardPlayButton movieId="different-movie-456" />);
      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href", "/watch/different-movie-456");
    });

    it("handles movieId with special characters", () => {
      render(<PlaylistCardPlayButton movieId="movie-with-dash_123" />);
      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href", "/watch/movie-with-dash_123");
    });
  });

  describe("Props Handling", () => {
    it("accepts and uses movieId prop", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId="test-movie" />
      );
      expect(container.querySelector('a[href="/watch/test-movie"]')).toBeInTheDocument();
    });

    it("updates href when movieId changes", () => {
      const { rerender } = render(
        <PlaylistCardPlayButton movieId="movie-1" />
      );
      expect(screen.getByTestId("mock-link")).toHaveAttribute(
        "href",
        "/watch/movie-1"
      );

      rerender(<PlaylistCardPlayButton movieId="movie-2" />);
      expect(screen.getByTestId("mock-link")).toHaveAttribute(
        "href",
        "/watch/movie-2"
      );
    });
  });

  describe("Component Structure", () => {
    it("renders Link as wrapper", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId("mock-link");
      expect(link.tagName).toBe("A");
    });

    it("contains button container with proper structure", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const buttonDiv = container.querySelector(".flex.flex-row.items-center");
      expect(buttonDiv).toBeInTheDocument();
    });

    it("has cursor-pointer class for interactivity", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const buttonDiv = container.querySelector(".cursor-pointer");
      expect(buttonDiv).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies responsive styling classes", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const buttonDiv = container.querySelector("div");
      expect(buttonDiv).toHaveClass("p-1", "xl:p-2");
    });

    it("applies background and hover classes", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const buttonDiv = container.querySelector(".bg-white");
      expect(buttonDiv).toHaveClass("hover:bg-neutral-400");
    });

    it("applies rounded styling", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const buttonDiv = container.querySelector(".rounded-full");
      expect(buttonDiv).toHaveClass("xl:rounded-md");
    });

    it("applies responsive width classes", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const buttonDiv = container.querySelector(".w-10");
      expect(buttonDiv).toHaveClass("xl:w-auto");
    });

    it("applies responsive text size classes", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const buttonDiv = container.querySelector(".text-md");
      expect(buttonDiv).toHaveClass("xl:text-lg");
    });
  });

  describe("Icon Styling", () => {
    it("applies margin classes to icon", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId("fa-play");
      expect(icon).toHaveClass("m-1", "xl:m-0", "xl:mr-2", "mr-0.5");
    });

    it("icon has correct className structure", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      const icon = screen.getByTestId("fa-play");
      const className = icon.className;
      expect(className).toContain("m-1");
      expect(className).toContain("xl:m-0");
    });
  });

  describe("Text Visibility", () => {
    it("renders Play text with hidden class on small screens", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const playText = screen.getByText("Play");
      expect(playText.tagName).toBe("P");
      expect(playText).toHaveClass("hidden", "xl:block");
    });

    it("Play text is in a paragraph element", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const playText = container.querySelector("p");
      expect(playText).toHaveTextContent("Play");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty movieId", () => {
      render(<PlaylistCardPlayButton movieId="" />);
      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href", "/watch/");
    });

    it("handles numeric movieId", () => {
      render(<PlaylistCardPlayButton movieId="12345" />);
      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href", "/watch/12345");
    });

    it("handles movieId with spaces", () => {
      render(<PlaylistCardPlayButton movieId="movie with spaces" />);
      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href", "/watch/movie with spaces");
    });

    it("handles very long movieId", () => {
      const longId = "a".repeat(100);
      render(<PlaylistCardPlayButton movieId={longId} />);
      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href", `/watch/${longId}`);
    });
  });

  describe("Component Composition", () => {
    it("renders icon and text in correct order", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );
      const buttonDiv = container.querySelector("div");
      const children = Array.from(buttonDiv?.children || []);
      
      expect(children.length).toBeGreaterThanOrEqual(2);
      expect(children[0]).toHaveAttribute("data-testid", "fa-play");
    });

    it("maintains structure with multiple props", () => {
      render(<PlaylistCardPlayButton movieId="test" />);
      
      expect(screen.getByTestId("mock-link")).toBeInTheDocument();
      expect(screen.getByTestId("fa-play")).toBeInTheDocument();
      expect(screen.getByText("Play")).toBeInTheDocument();
    });
  });

  describe("Re-render Behavior", () => {
    it("handles re-render with same props", () => {
      const { rerender } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );

      rerender(<PlaylistCardPlayButton movieId={mockMovieId} />);

      expect(screen.getByTestId("mock-link")).toHaveAttribute(
        "href",
        "/watch/movie-123"
      );
      expect(screen.getByTestId("fa-play")).toBeInTheDocument();
    });

    it("updates correctly on prop change", () => {
      const { rerender } = render(
        <PlaylistCardPlayButton movieId="initial-id" />
      );

      expect(screen.getByTestId("mock-link")).toHaveAttribute(
        "href",
        "/watch/initial-id"
      );

      rerender(<PlaylistCardPlayButton movieId="updated-id" />);

      expect(screen.getByTestId("mock-link")).toHaveAttribute(
        "href",
        "/watch/updated-id"
      );
    });
  });

  describe("Accessibility", () => {
    it("provides visual text for screen readers", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      expect(screen.getByText("Play")).toBeInTheDocument();
    });

    it("link is accessible", () => {
      render(<PlaylistCardPlayButton movieId={mockMovieId} />);
      const link = screen.getByTestId("mock-link");
      expect(link).toHaveAttribute("href");
    });
  });

  describe("Integration", () => {
    it("renders all elements together correctly", () => {
      const { container } = render(
        <PlaylistCardPlayButton movieId={mockMovieId} />
      );

      // Check Link
      expect(screen.getByTestId("mock-link")).toBeInTheDocument();
      
      // Check Icon
      expect(screen.getByTestId("fa-play")).toBeInTheDocument();
      
      // Check Text
      expect(screen.getByText("Play")).toBeInTheDocument();
      
      // Check href
      expect(screen.getByTestId("mock-link")).toHaveAttribute(
        "href",
        "/watch/movie-123"
      );
    });

    it("maintains correct structure after multiple renders", () => {
      const { rerender } = render(
        <PlaylistCardPlayButton movieId="movie-1" />
      );

      rerender(<PlaylistCardPlayButton movieId="movie-2" />);
      rerender(<PlaylistCardPlayButton movieId="movie-3" />);

      expect(screen.getByTestId("mock-link")).toHaveAttribute(
        "href",
        "/watch/movie-3"
      );
      expect(screen.getByTestId("fa-play")).toBeInTheDocument();
      expect(screen.getByText("Play")).toBeInTheDocument();
    });
  });
});
