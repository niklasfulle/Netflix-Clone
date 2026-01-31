import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, width, height }: any) => (
    <img
      data-testid="next-image"
      src={src}
      alt={alt}
      data-width={width}
      data-height={height}
    />
  ),
}));

// Mock react-icons
jest.mock("react-icons/fa", () => ({
  FaArrowUp: ({ className, size, onClick }: any) => (
    <div
      data-testid="fa-arrow-up"
      data-size={size}
      className={className}
      onClick={onClick}
      role="button"
    >
      ArrowUp
    </div>
  ),
  FaArrowDown: ({ className, size, onClick }: any) => (
    <div
      data-testid="fa-arrow-down"
      data-size={size}
      className={className}
      onClick={onClick}
      role="button"
    >
      ArrowDown
    </div>
  ),
  FaArrowLeft: ({ className, size, onClick }: any) => (
    <div
      data-testid="fa-arrow-left"
      data-size={size}
      className={className}
      onClick={onClick}
      role="button"
    >
      ArrowLeft
    </div>
  ),
  FaArrowRight: ({ className, size, onClick }: any) => (
    <div
      data-testid="fa-arrow-right"
      data-size={size}
      className={className}
      onClick={onClick}
      role="button"
    >
      ArrowRight
    </div>
  ),
  FaTrashAlt: ({ className, size, onClick }: any) => (
    <div
      data-testid="fa-trash-alt"
      data-size={size}
      className={className}
      onClick={onClick}
      role="button"
    >
      Trash
    </div>
  ),
}));

// Import component after mocks
import PlaylistEntryCard from "../PlaylistEntryCard";

describe("PlaylistEntryCard", () => {
  const mockMovie = {
    id: "movie-1",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    title: "Test Movie",
  };
  const mockOnMove = jest.fn();
  const mockOnClickDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders the component", () => {
      const { container } = render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders container with relative positioning", () => {
      const { container } = render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("relative", "w-full");
    });
  });

  describe("Image Rendering", () => {
    it("renders Next.js Image component", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      expect(screen.getByTestId("next-image")).toBeInTheDocument();
    });

    it("passes correct src from movie.thumbnailUrl", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("src", mockMovie.thumbnailUrl);
    });

    it("renders image with empty alt text", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("alt", "");
    });

    it("renders image with correct dimensions", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("data-width", "1920");
      expect(image).toHaveAttribute("data-height", "1080");
    });

    it("updates image when movie changes", () => {
      const { rerender } = render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const newMovie = { ...mockMovie, thumbnailUrl: "https://example.com/new.jpg" };
      rerender(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={newMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("src", "https://example.com/new.jpg");
    });
  });

  describe("Delete Button", () => {
    it("always renders delete button", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      expect(screen.getByTestId("fa-trash-alt")).toBeInTheDocument();
    });

    it("delete button has correct size", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      const deleteBtn = screen.getByTestId("fa-trash-alt");
      expect(deleteBtn).toHaveAttribute("data-size", "18");
    });

    it("delete button has correct styling", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      const deleteBtn = screen.getByTestId("fa-trash-alt");
      expect(deleteBtn).toHaveClass(
        "absolute",
        "z-10",
        "text-red-600",
        "cursor-pointer",
        "right-1",
        "bottom-1",
        "hover:text-red-400"
      );
    });

    it("delete button calls onClickDelete with movie.id", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      const deleteBtn = screen.getByTestId("fa-trash-alt");
      fireEvent.click(deleteBtn);
      expect(mockOnClickDelete).toHaveBeenCalledWith("movie-1");
    });

    it("delete button is present across all size configurations", () => {
      const sizes = [1, 2, 3, 4, 5, 10];
      sizes.forEach((size) => {
        const { unmount } = render(
          <PlaylistEntryCard
            index={0}
            size={size}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        expect(screen.getByTestId("fa-trash-alt")).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Size 1 - No Arrows", () => {
    it("renders no arrow buttons when size is 1", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.queryByTestId("fa-arrow-up")).not.toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-down")).not.toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-left")).not.toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-right")).not.toBeInTheDocument();
    });

    it("only shows delete button when size is 1", () => {
      const { container } = render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-trash-alt")).toBeInTheDocument();
      const buttons = container.querySelectorAll('[role="button"]');
      expect(buttons.length).toBe(1); // Only delete button
    });
  });

  describe("Size 2 - Index 0", () => {
    it("renders only right arrow for size 2, index 0", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-left")).not.toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-up")).not.toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-down")).not.toBeInTheDocument();
    });

    it("right arrow has correct styling for size 2, index 0", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const arrow = screen.getByTestId("fa-arrow-right");
      expect(arrow).toHaveClass(
        "absolute",
        "z-10",
        "text-white",
        "cursor-pointer",
        "right-1",
        "my-auto",
        "top-0",
        "bottom-0",
        "hover:text-neutral-300"
      );
    });

    it("right arrow calls onMove with 'down' and index 0", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const arrow = screen.getByTestId("fa-arrow-right");
      fireEvent.click(arrow);
      expect(mockOnMove).toHaveBeenCalledWith("down", 0);
    });
  });

  describe("Size 2 - Index 1", () => {
    it("renders only left arrow for size 2, index 1", () => {
      render(
        <PlaylistEntryCard
          index={1}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-left")).toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-right")).not.toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-up")).not.toBeInTheDocument();
      expect(screen.queryByTestId("fa-arrow-down")).not.toBeInTheDocument();
    });

    it("left arrow has correct styling for size 2, index 1", () => {
      render(
        <PlaylistEntryCard
          index={1}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const arrow = screen.getByTestId("fa-arrow-left");
      expect(arrow).toHaveClass(
        "absolute",
        "z-10",
        "text-white",
        "cursor-pointer",
        "left-1",
        "my-auto",
        "top-0",
        "bottom-0",
        "hover:text-neutral-300"
      );
    });

    it("left arrow calls onMove with 'up' and index 1", () => {
      render(
        <PlaylistEntryCard
          index={1}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const arrow = screen.getByTestId("fa-arrow-left");
      fireEvent.click(arrow);
      expect(mockOnMove).toHaveBeenCalledWith("up", 1);
    });
  });

  describe("Size > 2 - Position Logic", () => {
    describe("Position 1 (index % 4 = 0, i.e., (index+1) % 4 = 1)", () => {
      it("renders up and right arrows for position 1", () => {
        // index=0: (0+1)%4=1
        render(
          <PlaylistEntryCard
            index={0}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        expect(screen.getByTestId("fa-arrow-up")).toBeInTheDocument();
        expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
        expect(screen.queryByTestId("fa-arrow-left")).not.toBeInTheDocument();
        expect(screen.queryByTestId("fa-arrow-down")).not.toBeInTheDocument();
      });

      it("up arrow is positioned at top center", () => {
        render(
          <PlaylistEntryCard
            index={0}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        const arrow = screen.getByTestId("fa-arrow-up");
        expect(arrow).toHaveClass("left-0", "right-0", "mx-auto", "top-1");
      });

      it("right arrow is positioned at right center", () => {
        render(
          <PlaylistEntryCard
            index={0}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        const arrow = screen.getByTestId("fa-arrow-right");
        expect(arrow).toHaveClass("right-1", "my-auto", "top-0", "bottom-0");
      });

      it("arrows call onMove correctly for position 1", () => {
        render(
          <PlaylistEntryCard
            index={0}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        fireEvent.click(screen.getByTestId("fa-arrow-up"));
        expect(mockOnMove).toHaveBeenCalledWith("up", 0);
        
        fireEvent.click(screen.getByTestId("fa-arrow-right"));
        expect(mockOnMove).toHaveBeenCalledWith("down", 0);
      });
    });

    describe("Position 2 (index % 4 = 1, i.e., (index+1) % 4 = 2)", () => {
      it("renders left and down arrows for position 2", () => {
        // index=1: (1+1)%4=2
        render(
          <PlaylistEntryCard
            index={1}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        expect(screen.getByTestId("fa-arrow-left")).toBeInTheDocument();
        expect(screen.getByTestId("fa-arrow-down")).toBeInTheDocument();
        expect(screen.queryByTestId("fa-arrow-up")).not.toBeInTheDocument();
        expect(screen.queryByTestId("fa-arrow-right")).not.toBeInTheDocument();
      });

      it("left arrow is positioned at left center", () => {
        render(
          <PlaylistEntryCard
            index={1}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        const arrow = screen.getByTestId("fa-arrow-left");
        expect(arrow).toHaveClass("left-1", "my-auto", "top-0", "bottom-0");
      });

      it("down arrow is positioned at bottom center", () => {
        render(
          <PlaylistEntryCard
            index={1}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        const arrow = screen.getByTestId("fa-arrow-down");
        expect(arrow).toHaveClass("left-0", "right-0", "mx-auto", "bottom-1");
      });

      it("arrows call onMove correctly for position 2", () => {
        render(
          <PlaylistEntryCard
            index={1}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        fireEvent.click(screen.getByTestId("fa-arrow-left"));
        expect(mockOnMove).toHaveBeenCalledWith("up", 1);
        
        fireEvent.click(screen.getByTestId("fa-arrow-down"));
        expect(mockOnMove).toHaveBeenCalledWith("down", 1);
      });
    });

    describe("Position 3 (index % 4 = 2, i.e., (index+1) % 4 = 3)", () => {
      it("renders up and right arrows for position 3", () => {
        // index=2: (2+1)%4=3
        render(
          <PlaylistEntryCard
            index={2}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        expect(screen.getByTestId("fa-arrow-up")).toBeInTheDocument();
        expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
        expect(screen.queryByTestId("fa-arrow-left")).not.toBeInTheDocument();
        expect(screen.queryByTestId("fa-arrow-down")).not.toBeInTheDocument();
      });

      it("arrows call onMove correctly for position 3", () => {
        render(
          <PlaylistEntryCard
            index={2}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        fireEvent.click(screen.getByTestId("fa-arrow-up"));
        expect(mockOnMove).toHaveBeenCalledWith("up", 2);
        
        fireEvent.click(screen.getByTestId("fa-arrow-right"));
        expect(mockOnMove).toHaveBeenCalledWith("down", 2);
      });
    });

    describe("Position 4 (index % 4 = 3, i.e., (index+1) % 4 = 0)", () => {
      it("renders left and down arrows for position 4", () => {
        // index=3: (3+1)%4=0
        render(
          <PlaylistEntryCard
            index={3}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        expect(screen.getByTestId("fa-arrow-left")).toBeInTheDocument();
        expect(screen.getByTestId("fa-arrow-down")).toBeInTheDocument();
        expect(screen.queryByTestId("fa-arrow-up")).not.toBeInTheDocument();
        expect(screen.queryByTestId("fa-arrow-right")).not.toBeInTheDocument();
      });

      it("arrows call onMove correctly for position 4", () => {
        render(
          <PlaylistEntryCard
            index={3}
            size={5}
            movie={mockMovie}
            onMove={mockOnMove}
            onClickDelete={mockOnClickDelete}
          />
        );
        
        fireEvent.click(screen.getByTestId("fa-arrow-left"));
        expect(mockOnMove).toHaveBeenCalledWith("up", 3);
        
        fireEvent.click(screen.getByTestId("fa-arrow-down"));
        expect(mockOnMove).toHaveBeenCalledWith("down", 3);
      });
    });

    it("cycles position pattern correctly for higher indices", () => {
      // Test index=4: (4+1)%4=1 -> up and right
      const { unmount } = render(
        <PlaylistEntryCard
          index={4}
          size={10}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-up")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
      unmount();
      
      // Test index=5: (5+1)%4=2 -> left and down
      const { unmount: unmount2 } = render(
        <PlaylistEntryCard
          index={5}
          size={10}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-left")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-down")).toBeInTheDocument();
      unmount2();
    });
  });

  describe("Arrow Icon Properties", () => {
    it("all arrows have size 18", () => {
      render(
        <PlaylistEntryCard
          index={2}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const upArrow = screen.getByTestId("fa-arrow-up");
      const rightArrow = screen.getByTestId("fa-arrow-right");
      
      expect(upArrow).toHaveAttribute("data-size", "18");
      expect(rightArrow).toHaveAttribute("data-size", "18");
    });

    it("all arrows have common styling classes", () => {
      render(
        <PlaylistEntryCard
          index={1}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const arrows = [
        screen.getByTestId("fa-arrow-left"),
        screen.getByTestId("fa-arrow-down"),
      ];
      
      arrows.forEach((arrow) => {
        expect(arrow).toHaveClass("absolute", "z-10", "text-white", "cursor-pointer");
        expect(arrow).toHaveClass("transition-all", "ease-in", "hover:text-neutral-300");
      });
    });

    it("arrows are clickable", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const upArrow = screen.getByTestId("fa-arrow-up");
      const rightArrow = screen.getByTestId("fa-arrow-right");
      
      expect(upArrow).toHaveAttribute("role", "button");
      expect(rightArrow).toHaveAttribute("role", "button");
    });
  });

  describe("Props Handling", () => {
    it("accepts and uses index prop", () => {
      const { rerender } = render(
        <PlaylistEntryCard
          index={0}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const upArrow = screen.getByTestId("fa-arrow-up");
      fireEvent.click(upArrow);
      expect(mockOnMove).toHaveBeenCalledWith("up", 0);
      
      jest.clearAllMocks();
      
      rerender(
        <PlaylistEntryCard
          index={3}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const leftArrow = screen.getByTestId("fa-arrow-left");
      fireEvent.click(leftArrow);
      expect(mockOnMove).toHaveBeenCalledWith("up", 3);
    });

    it("accepts and uses size prop", () => {
      const { rerender } = render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.queryByTestId("fa-arrow-up")).not.toBeInTheDocument();
      
      rerender(
        <PlaylistEntryCard
          index={0}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-up")).toBeInTheDocument();
    });

    it("accepts and uses movie prop", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const image = screen.getByTestId("next-image");
      expect(image).toHaveAttribute("src", mockMovie.thumbnailUrl);
      
      const deleteBtn = screen.getByTestId("fa-trash-alt");
      fireEvent.click(deleteBtn);
      expect(mockOnClickDelete).toHaveBeenCalledWith(mockMovie.id);
    });

    it("accepts and uses onMove callback", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const rightArrow = screen.getByTestId("fa-arrow-right");
      fireEvent.click(rightArrow);
      expect(mockOnMove).toHaveBeenCalled();
    });

    it("accepts and uses onClickDelete callback", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const deleteBtn = screen.getByTestId("fa-trash-alt");
      fireEvent.click(deleteBtn);
      expect(mockOnClickDelete).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles size 0", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={0}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      // Size 0 doesn't match any conditions except != 1, != 2, and not > 2
      expect(screen.queryByTestId("fa-arrow-up")).not.toBeInTheDocument();
      expect(screen.getByTestId("fa-trash-alt")).toBeInTheDocument();
    });

    it("handles negative index", () => {
      render(
        <PlaylistEntryCard
          index={-1}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      // (-1+1)%4=0 -> left and down arrows
      expect(screen.getByTestId("fa-arrow-left")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-down")).toBeInTheDocument();
    });

    it("handles large index values", () => {
      render(
        <PlaylistEntryCard
          index={100}
          size={200}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      // (100+1)%4=1 -> up and right arrows
      expect(screen.getByTestId("fa-arrow-up")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
    });

    it("handles movie without thumbnailUrl", () => {
      const movieWithoutThumbnail = { ...mockMovie, thumbnailUrl: undefined };
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={movieWithoutThumbnail}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("next-image")).toBeInTheDocument();
    });

    it("handles movie without id", () => {
      const movieWithoutId = { ...mockMovie, id: undefined };
      render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={movieWithoutId}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const deleteBtn = screen.getByTestId("fa-trash-alt");
      fireEvent.click(deleteBtn);
      expect(mockOnClickDelete).toHaveBeenCalledWith(undefined);
    });

    it("handles null callbacks gracefully", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={null as any}
          onClickDelete={null as any}
        />
      );
      
      expect(screen.getByTestId("fa-trash-alt")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
    });

    it("handles multiple rapid clicks", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const rightArrow = screen.getByTestId("fa-arrow-right");
      fireEvent.click(rightArrow);
      fireEvent.click(rightArrow);
      fireEvent.click(rightArrow);
      
      expect(mockOnMove).toHaveBeenCalledTimes(3);
      expect(mockOnMove).toHaveBeenCalledWith("down", 0);
    });
  });

  describe("Re-render Behavior", () => {
    it("updates arrows when index changes", () => {
      const { rerender } = render(
        <PlaylistEntryCard
          index={0}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-up")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
      
      rerender(
        <PlaylistEntryCard
          index={1}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-left")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-down")).toBeInTheDocument();
    });

    it("updates arrows when size changes", () => {
      const { rerender } = render(
        <PlaylistEntryCard
          index={0}
          size={1}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.queryByTestId("fa-arrow-up")).not.toBeInTheDocument();
      
      rerender(
        <PlaylistEntryCard
          index={0}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-up")).toBeInTheDocument();
    });

    it("preserves functionality after re-render", () => {
      const { rerender } = render(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      rerender(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const rightArrow = screen.getByTestId("fa-arrow-right");
      fireEvent.click(rightArrow);
      expect(mockOnMove).toHaveBeenCalledWith("down", 0);
    });
  });

  describe("Accessibility", () => {
    it("all interactive elements have role button", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("role", "button");
      });
    });

    it("all buttons have cursor-pointer class", () => {
      render(
        <PlaylistEntryCard
          index={2}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("cursor-pointer");
      });
    });
  });

  describe("Integration", () => {
    it("renders all elements correctly together", () => {
      render(
        <PlaylistEntryCard
          index={2}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("next-image")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-up")).toBeInTheDocument();
      expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
      expect(screen.getByTestId("fa-trash-alt")).toBeInTheDocument();
    });

    it("handles complete interaction flow", () => {
      render(
        <PlaylistEntryCard
          index={0}
          size={5}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      fireEvent.click(screen.getByTestId("fa-arrow-up"));
      expect(mockOnMove).toHaveBeenCalledWith("up", 0);
      
      fireEvent.click(screen.getByTestId("fa-arrow-right"));
      expect(mockOnMove).toHaveBeenCalledWith("down", 0);
      
      fireEvent.click(screen.getByTestId("fa-trash-alt"));
      expect(mockOnClickDelete).toHaveBeenCalledWith("movie-1");
    });

    it("maintains correct state across multiple updates", () => {
      const { rerender } = render(
        <PlaylistEntryCard
          index={0}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-right")).toBeInTheDocument();
      
      rerender(
        <PlaylistEntryCard
          index={1}
          size={2}
          movie={mockMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      expect(screen.getByTestId("fa-arrow-left")).toBeInTheDocument();
      
      const newMovie = { id: "movie-2", thumbnailUrl: "new.jpg" };
      rerender(
        <PlaylistEntryCard
          index={1}
          size={2}
          movie={newMovie}
          onMove={mockOnMove}
          onClickDelete={mockOnClickDelete}
        />
      );
      
      fireEvent.click(screen.getByTestId("fa-trash-alt"));
      expect(mockOnClickDelete).toHaveBeenCalledWith("movie-2");
    });
  });
});
