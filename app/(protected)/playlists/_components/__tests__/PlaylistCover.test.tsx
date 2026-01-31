import React from "react";
import { render, screen } from "@testing-library/react";
import { Movie } from "@prisma/client";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return (
      <img
        src={props.src}
        alt={props.alt}
        width={props.width}
        height={props.height}
        className={props.className}
        data-priority={props.priority ? "true" : "false"}
        data-testid="next-image"
      />
    );
  },
}));

// Import component after mocks
import PlaylistCover from "../PlaylistCover";

describe("PlaylistCover", () => {
  const createMockMovie = (id: string, thumbnailUrl: string): Partial<Movie> => ({
    id,
    thumbnailUrl,
    title: `Movie ${id}`,
    description: "Description",
    videoUrl: "video.mp4",
    duration: "120 min",
    genre: "Action",
  });

  const mockMovies = [
    createMockMovie("1", "/thumbnails/movie1.jpg"),
    createMockMovie("2", "/thumbnails/movie2.jpg"),
    createMockMovie("3", "/thumbnails/movie3.jpg"),
    createMockMovie("4", "/thumbnails/movie4.jpg"),
    createMockMovie("5", "/thumbnails/movie5.jpg"),
  ] as Movie[];

  describe("Rendering - Empty State (0 Movies)", () => {
    it("renders SVG icon when movies array is empty", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("SVG has correct classes", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-10", "h-10", "text-zinc-500");
    });

    it("SVG has aria-hidden attribute", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("SVG has correct viewBox", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 20 18");
    });

    it("SVG contains path element", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      const path = container.querySelector("svg path");
      expect(path).toBeInTheDocument();
    });

    it("does not render images when empty", () => {
      render(<PlaylistCover movies={[]} />);
      const images = screen.queryAllByTestId("next-image");
      expect(images).toHaveLength(0);
    });
  });

  describe("Rendering - Single Image (1-3 Movies)", () => {
    it("renders single image with 1 movie", () => {
      render(<PlaylistCover movies={[mockMovies[0]]} />);
      const images = screen.getAllByTestId("next-image");
      expect(images).toHaveLength(1);
    });

    it("renders single image with 2 movies", () => {
      render(<PlaylistCover movies={mockMovies.slice(0, 2)} />);
      const images = screen.getAllByTestId("next-image");
      expect(images).toHaveLength(1);
    });

    it("renders single image with 3 movies", () => {
      render(<PlaylistCover movies={mockMovies.slice(0, 3)} />);
      const images = screen.getAllByTestId("next-image");
      expect(images).toHaveLength(1);
    });

    it("uses first movie thumbnail for single image", () => {
      render(<PlaylistCover movies={mockMovies.slice(0, 2)} />);
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("src", "/thumbnails/movie1.jpg");
    });

    it("single image has correct dimensions", () => {
      render(<PlaylistCover movies={[mockMovies[0]]} />);
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("width", "1920");
      expect(image).toHaveAttribute("height", "1080");
    });

    it("single image has priority prop", () => {
      render(<PlaylistCover movies={[mockMovies[0]]} />);
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("data-priority", "true");
    });

    it("single image has correct alt text", () => {
      render(<PlaylistCover movies={[mockMovies[0]]} />);
      const image = screen.getByAltText("Thumbnail");
      expect(image).toBeInTheDocument();
    });

    it("single image has correct styling classes", () => {
      render(<PlaylistCover movies={[mockMovies[0]]} />);
      const image = screen.getByTestId("next-image");
      expect(image).toHaveClass(
        "cursor-pointer",
        "object-cover",
        "transition",
        "duration",
        "shadow-xl",
        "rounded-t-md",
        "w-full"
      );
    });

    it("does not render SVG with 1-3 movies", () => {
      const { container } = render(<PlaylistCover movies={mockMovies.slice(0, 2)} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe("Rendering - Grid Layout (5+ Movies)", () => {
    it("renders 4 images with 5 movies", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      expect(images).toHaveLength(4);
    });

    it("renders 4 images with 6 movies", () => {
      const sixMovies = [...mockMovies, createMockMovie("6", "/thumbnails/movie6.jpg")] as Movie[];
      render(<PlaylistCover movies={sixMovies} />);
      const images = screen.getAllByTestId("next-image");
      expect(images).toHaveLength(4);
    });

    it("uses first 4 movies for grid", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      
      expect(images[0]).toHaveAttribute("src", "/thumbnails/movie1.jpg");
      expect(images[1]).toHaveAttribute("src", "/thumbnails/movie2.jpg");
      expect(images[2]).toHaveAttribute("src", "/thumbnails/movie3.jpg");
      expect(images[3]).toHaveAttribute("src", "/thumbnails/movie4.jpg");
    });

    it("all grid images have correct dimensions", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      
      images.forEach((image) => {
        expect(image).toHaveAttribute("width", "1920");
        expect(image).toHaveAttribute("height", "1080");
      });
    });

    it("all grid images have priority prop", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      
      images.forEach((image) => {
        expect(image).toHaveAttribute("data-priority", "true");
      });
    });

    it("all grid images have alt text", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByAltText("Thumbnail");
      expect(images).toHaveLength(4);
    });

    it("first image has top-left rounded corner", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      expect(images[0]).toHaveClass("rounded-tl-md");
    });

    it("second image has top-right rounded corner", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      expect(images[1]).toHaveClass("rounded-tr-md");
    });

    it("third and fourth images do not have rounded corners", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      expect(images[2]).not.toHaveClass("rounded-tl-md", "rounded-tr-md");
      expect(images[3]).not.toHaveClass("rounded-tl-md", "rounded-tr-md");
    });

    it("all grid images have common styling", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      
      images.forEach((image) => {
        expect(image).toHaveClass(
          "cursor-pointer",
          "object-cover",
          "transition",
          "duration",
          "w-full"
        );
      });
    });

    it("does not render SVG with 5+ movies", () => {
      const { container } = render(<PlaylistCover movies={mockMovies} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("renders nothing with exactly 4 movies (boundary condition bug)", () => {
      const { container } = render(<PlaylistCover movies={mockMovies.slice(0, 4)} />);
      
      // Component has a bug: 4 movies don't match any condition
      // > 0 && < 4 is false, > 4 is false, == 0 is false
      const svg = container.querySelector("svg");
      const images = screen.queryAllByTestId("next-image");
      
      expect(svg).not.toBeInTheDocument();
      expect(images).toHaveLength(0);
    });

    it("handles movies with missing thumbnailUrl gracefully", () => {
      const moviesWithoutThumbnail = [
        { ...mockMovies[0], thumbnailUrl: undefined },
      ] as any;
      
      render(<PlaylistCover movies={moviesWithoutThumbnail} />);
      const image = screen.getByTestId("next-image");
      // Image component receives undefined which Next.js handles
      expect(image).toBeInTheDocument();
    });

    it("handles very large movie array", () => {
      const manyMovies = Array.from({ length: 100 }, (_, i) =>
        createMockMovie(`${i}`, `/thumbnails/movie${i}.jpg`)
      ) as Movie[];
      
      render(<PlaylistCover movies={manyMovies} />);
      const images = screen.getAllByTestId("next-image");
      expect(images).toHaveLength(4);
    });

    it("handles movies with special characters in thumbnail URL", () => {
      const specialMovie = createMockMovie("special", "/thumbnails/movie%20(1).jpg") as Movie;
      render(<PlaylistCover movies={[specialMovie]} />);
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("src", "/thumbnails/movie%20(1).jpg");
    });
  });

  describe("Props Handling", () => {
    it("accepts empty movies array", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      expect(container).toBeInTheDocument();
    });

    it("accepts movies array prop", () => {
      const { container } = render(<PlaylistCover movies={mockMovies} />);
      expect(container).toBeInTheDocument();
    });

    it("updates when movies prop changes", () => {
      const { rerender } = render(<PlaylistCover movies={[]} />);
      
      // Initially empty - should show SVG
      let svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
      
      // Update to 1 movie - should show image
      rerender(<PlaylistCover movies={[mockMovies[0]]} />);
      expect(screen.getByTestId("next-image")).toBeInTheDocument();
      
      // Update to 5 movies - should show 4 images
      rerender(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      expect(images).toHaveLength(4);
    });
  });

  describe("Conditional Rendering Logic", () => {
    it("shows SVG for 0 movies only", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      const svg = container.querySelector("svg");
      const images = screen.queryAllByTestId("next-image");
      
      expect(svg).toBeInTheDocument();
      expect(images).toHaveLength(0);
    });

    it("shows single image for 1 movie", () => {
      const { container } = render(<PlaylistCover movies={[mockMovies[0]]} />);
      const svg = container.querySelector("svg");
      const images = screen.getAllByTestId("next-image");
      
      expect(svg).not.toBeInTheDocument();
      expect(images).toHaveLength(1);
    });

    it("shows single image for 3 movies", () => {
      const { container } = render(<PlaylistCover movies={mockMovies.slice(0, 3)} />);
      const svg = container.querySelector("svg");
      const images = screen.getAllByTestId("next-image");
      
      expect(svg).not.toBeInTheDocument();
      expect(images).toHaveLength(1);
    });

    it("shows grid for 5 movies", () => {
      const { container } = render(<PlaylistCover movies={mockMovies} />);
      const svg = container.querySelector("svg");
      const images = screen.getAllByTestId("next-image");
      
      expect(svg).not.toBeInTheDocument();
      expect(images).toHaveLength(4);
    });
  });

  describe("Image Properties", () => {
    it("all images use Next.js Image component", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      expect(images.length).toBeGreaterThan(0);
    });

    it("single image has responsive height classes", () => {
      render(<PlaylistCover movies={[mockMovies[0]]} />);
      const image = screen.getByTestId("next-image");
      const className = image.className;
      expect(className).toContain("h-[24vw]");
      expect(className).toContain("lg:h-[12vw]");
    });

    it("grid images have responsive height classes", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByTestId("next-image");
      
      images.forEach((image) => {
        const className = image.className;
        expect(className).toContain("h-[12vw]");
        expect(className).toContain("lg:h-[6vw]");
      });
    });
  });

  describe("Re-render Behavior", () => {
    it("maintains correct state after re-render with same props", () => {
      const { rerender } = render(<PlaylistCover movies={mockMovies} />);
      
      const imagesBefore = screen.getAllByTestId("next-image");
      expect(imagesBefore).toHaveLength(4);
      
      rerender(<PlaylistCover movies={mockMovies} />);
      
      const imagesAfter = screen.getAllByTestId("next-image");
      expect(imagesAfter).toHaveLength(4);
    });

    it("switches from empty to populated correctly", () => {
      const { rerender, container } = render(<PlaylistCover movies={[]} />);
      
      expect(container.querySelector("svg")).toBeInTheDocument();
      
      rerender(<PlaylistCover movies={[mockMovies[0]]} />);
      
      expect(container.querySelector("svg")).not.toBeInTheDocument();
      expect(screen.getByTestId("next-image")).toBeInTheDocument();
    });

    it("switches from single to grid correctly", () => {
      const { rerender } = render(<PlaylistCover movies={[mockMovies[0]]} />);
      
      expect(screen.getAllByTestId("next-image")).toHaveLength(1);
      
      rerender(<PlaylistCover movies={mockMovies} />);
      
      expect(screen.getAllByTestId("next-image")).toHaveLength(4);
    });
  });

  describe("Accessibility", () => {
    it("SVG is hidden from screen readers", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("images have descriptive alt text", () => {
      render(<PlaylistCover movies={[mockMovies[0]]} />);
      expect(screen.getByAltText("Thumbnail")).toBeInTheDocument();
    });

    it("all grid images have alt text", () => {
      render(<PlaylistCover movies={mockMovies} />);
      const images = screen.getAllByAltText("Thumbnail");
      expect(images).toHaveLength(4);
    });
  });

  describe("Component Structure", () => {
    it("renders within fragment", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders only one condition at a time", () => {
      const { container } = render(<PlaylistCover movies={mockMovies} />);
      
      const svg = container.querySelector("svg");
      const images = screen.getAllByTestId("next-image");
      
      // Should only render grid, not SVG
      expect(svg).not.toBeInTheDocument();
      expect(images).toHaveLength(4);
    });

    it("does not render multiple layouts simultaneously", () => {
      const { container } = render(<PlaylistCover movies={[mockMovies[0]]} />);
      
      const svg = container.querySelector("svg");
      const images = screen.getAllByTestId("next-image");
      
      // Should only render single image, not SVG or grid
      expect(svg).not.toBeInTheDocument();
      expect(images).toHaveLength(1);
    });
  });

  describe("Integration", () => {
    it("renders complete empty state", () => {
      const { container } = render(<PlaylistCover movies={[]} />);
      
      const svg = container.querySelector("svg");
      const path = container.querySelector("svg path");
      
      expect(svg).toBeInTheDocument();
      expect(path).toBeInTheDocument();
      expect(svg).toHaveClass("w-10", "h-10", "text-zinc-500");
    });

    it("renders complete single image state", () => {
      render(<PlaylistCover movies={[mockMovies[0]]} />);
      
      const image = screen.getByTestId("next-image");
      
      expect(image).toHaveAttribute("src", "/thumbnails/movie1.jpg");
      expect(image).toHaveAttribute("alt", "Thumbnail");
      expect(image).toHaveAttribute("data-priority", "true");
      expect(image).toHaveClass("cursor-pointer", "object-cover", "rounded-t-md");
    });

    it("renders complete grid state", () => {
      render(<PlaylistCover movies={mockMovies} />);
      
      const images = screen.getAllByTestId("next-image");
      
      expect(images).toHaveLength(4);
      expect(images[0]).toHaveClass("rounded-tl-md");
      expect(images[1]).toHaveClass("rounded-tr-md");
      
      images.forEach((image) => {
        expect(image).toHaveAttribute("alt", "Thumbnail");
        expect(image).toHaveAttribute("data-priority", "true");
      });
    });
  });
});
