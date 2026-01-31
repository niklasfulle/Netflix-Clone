import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import MovieAdminTable from "../MovieAdminTable";

// Mock EditMovieButton
jest.mock("../../EditMovieButton", () => {
  return function MockEditMovieButton({ movieId }: { movieId: string }) {
    return <button data-testid={`edit-button-${movieId}`}>Edit</button>;
  };
});

describe("MovieAdminTable Component", () => {
  const mockItems = [
    {
      id: "1",
      title: "Movie A",
      type: "movie",
      createdAt: "2024-01-01T00:00:00Z",
      views: 100,
      actors: [{ actor: { name: "Actor One" } }],
    },
    {
      id: "2",
      title: "Series B",
      type: "series",
      createdAt: "2024-02-01T00:00:00Z",
      views: 200,
      actors: [{ name: "Actor Two" }],
    },
    {
      id: "3",
      title: "Movie C",
      type: "movie",
      createdAt: "2024-03-01T00:00:00Z",
      views: 50,
      actors: [],
    },
  ];

  const mockSetPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(<MovieAdminTable items={[]} />);
      expect(screen.getByText("Movies/Series Management")).toBeInTheDocument();
    });

    it("should render the main heading", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText("Movies/Series Management")).toBeInTheDocument();
    });

    it("should render the table heading", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText("All Movies & Series")).toBeInTheDocument();
    });

    it("should render search input", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByPlaceholderText("Search by title...")).toBeInTheDocument();
    });

    it("should render table structure", () => {
      render(<MovieAdminTable items={mockItems} />);
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
    });
  });

  describe("Table Headers", () => {
    it("should render all column headers", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText(/Title/)).toBeInTheDocument();
      expect(screen.getByText(/Actors/)).toBeInTheDocument();
      expect(screen.getByText(/Typ/)).toBeInTheDocument();
      expect(screen.getByText(/Created/)).toBeInTheDocument();
      expect(screen.getByText(/Views/)).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("should render sortable headers with cursor pointer", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const headers = container.querySelectorAll("th.cursor-pointer");
      expect(headers.length).toBeGreaterThan(0);
    });

    it("should show sort indicator on default sorted column", () => {
      render(<MovieAdminTable items={mockItems} />);
      // Default sort is by title ascending
      expect(screen.getByText(/Title ▲/)).toBeInTheDocument();
    });

    it("should have select-none class on sortable headers", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const headers = container.querySelectorAll("th.select-none");
      expect(headers.length).toBe(5); // All sortable headers
    });
  });

  describe("Movie/Series Items Rendering", () => {
    it("should render all items", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText("Movie A")).toBeInTheDocument();
      expect(screen.getByText("Series B")).toBeInTheDocument();
      expect(screen.getByText("Movie C")).toBeInTheDocument();
    });

    it("should render item types", () => {
      render(<MovieAdminTable items={mockItems} />);
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should render view counts", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("200")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("should render edit buttons for each item", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByTestId("edit-button-1")).toBeInTheDocument();
      expect(screen.getByTestId("edit-button-2")).toBeInTheDocument();
      expect(screen.getByTestId("edit-button-3")).toBeInTheDocument();
    });

    it("should format dates correctly", () => {
      render(<MovieAdminTable items={mockItems} />);
      const date = new Date("2024-01-01T00:00:00Z").toLocaleDateString();
      expect(screen.getByText(date)).toBeInTheDocument();
    });
  });

  describe("Actor Display", () => {
    it("should display actor name from nested actor object", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText("Actor One")).toBeInTheDocument();
    });

    it("should display actor name from direct name property", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText("Actor Two")).toBeInTheDocument();
    });

    it("should display dash for items without actors", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const dashElements = container.querySelectorAll(".text-zinc-500");
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it("should handle multiple actors", () => {
      const itemsWithMultipleActors = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
          actors: [
            { actor: { name: "Actor One" } },
            { actor: { name: "Actor Two" } },
          ],
        },
      ];
      render(<MovieAdminTable items={itemsWithMultipleActors} />);
      expect(screen.getByText("Actor One, Actor Two")).toBeInTheDocument();
    });

    it("should filter out empty actor names", () => {
      const itemsWithEmptyActors = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
          actors: [{ actor: { name: "" } }, { actor: { name: "Valid Actor" } }],
        },
      ];
      render(<MovieAdminTable items={itemsWithEmptyActors} />);
      expect(screen.getByText("Valid Actor")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should filter items by title", () => {
      render(<MovieAdminTable items={mockItems} />);
      const searchInput = screen.getByPlaceholderText("Search by title...");
      fireEvent.change(searchInput, { target: { value: "Movie A" } });
      expect(screen.getByText("Movie A")).toBeInTheDocument();
      expect(screen.queryByText("Series B")).not.toBeInTheDocument();
    });

    it("should be case insensitive", () => {
      render(<MovieAdminTable items={mockItems} />);
      const searchInput = screen.getByPlaceholderText("Search by title...");
      fireEvent.change(searchInput, { target: { value: "movie a" } });
      expect(screen.getByText("Movie A")).toBeInTheDocument();
    });

    it("should filter multiple matches", () => {
      render(<MovieAdminTable items={mockItems} />);
      const searchInput = screen.getByPlaceholderText("Search by title...");
      fireEvent.change(searchInput, { target: { value: "Movie" } });
      expect(screen.getByText("Movie A")).toBeInTheDocument();
      expect(screen.getByText("Movie C")).toBeInTheDocument();
      expect(screen.queryByText("Series B")).not.toBeInTheDocument();
    });

    it("should update search state", () => {
      render(<MovieAdminTable items={mockItems} />);
      const searchInput = screen.getByPlaceholderText("Search by title...") as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: "test" } });
      expect(searchInput.value).toBe("test");
    });

    it("should call setPage(1) when search changes and setPage is provided", () => {
      render(<MovieAdminTable items={mockItems} page={2} setPage={mockSetPage} totalPages={5} />);
      const searchInput = screen.getByPlaceholderText("Search by title...");
      fireEvent.change(searchInput, { target: { value: "Movie" } });
      expect(mockSetPage).toHaveBeenCalledWith(1);
    });

    it("should not call setPage when not provided", () => {
      render(<MovieAdminTable items={mockItems} />);
      const searchInput = screen.getByPlaceholderText("Search by title...");
      fireEvent.change(searchInput, { target: { value: "Movie" } });
      expect(mockSetPage).not.toHaveBeenCalled();
    });
  });

  describe("Sorting Functionality", () => {
    it("should sort by title ascending by default", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const rows = container.querySelectorAll("tbody tr");
      const firstRow = rows[0] as HTMLElement;
      expect(within(firstRow).getByText("Movie A")).toBeInTheDocument();
    });

    it("should toggle sort direction when clicking same column", () => {
      render(<MovieAdminTable items={mockItems} />);
      const titleHeader = screen.getByText(/Title/);
      
      // Click to toggle to descending
      fireEvent.click(titleHeader);
      expect(screen.getByText(/Title ▼/)).toBeInTheDocument();
    });

    it("should sort by views when clicking views header", () => {
      const { rerender } = render(<MovieAdminTable items={mockItems} />);
      const viewsHeaders = screen.getAllByText(/Views/);
      const viewsHeader = viewsHeaders[0];
      fireEvent.click(viewsHeader);
      
      rerender(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText(/Views ▲/)).toBeInTheDocument();
    });

    it("should sort by type", () => {
      render(<MovieAdminTable items={mockItems} />);
      const typeHeader = screen.getByText(/Typ/);
      fireEvent.click(typeHeader);
      expect(screen.getByText(/Typ ▲/)).toBeInTheDocument();
    });

    it("should sort by created date", () => {
      render(<MovieAdminTable items={mockItems} />);
      const createdHeader = screen.getByText(/Created/);
      fireEvent.click(createdHeader);
      expect(screen.getByText(/Created ▲/)).toBeInTheDocument();
    });

    it("should sort by actors", () => {
      render(<MovieAdminTable items={mockItems} />);
      const actorsHeader = screen.getByText(/Actors/);
      fireEvent.click(actorsHeader);
      expect(screen.getByText(/Actors ▲/)).toBeInTheDocument();
    });

    it("should change sort key when clicking different column", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText(/Title ▲/)).toBeInTheDocument();
      
      const viewsHeader = screen.getByText(/Views/);
      fireEvent.click(viewsHeader);
      expect(screen.getByText(/Views ▲/)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty message when no items", () => {
      render(<MovieAdminTable items={[]} />);
      expect(screen.getByText("No movies or series found.")).toBeInTheDocument();
    });

    it("should show empty message when search returns no results", () => {
      render(<MovieAdminTable items={mockItems} />);
      const searchInput = screen.getByPlaceholderText("Search by title...");
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });
      expect(screen.getByText("No movies or series found.")).toBeInTheDocument();
    });

    it("should span all columns in empty state", () => {
      const { container } = render(<MovieAdminTable items={[]} />);
      const emptyCell = container.querySelector('td[colspan="6"]');
      expect(emptyCell).toBeInTheDocument();
    });
  });

  describe("Pagination Controls", () => {
    it("should render pagination when all props provided", () => {
      render(<MovieAdminTable items={mockItems} page={2} setPage={mockSetPage} totalPages={5} />);
      expect(screen.getByText("Seite 2 / 5")).toBeInTheDocument();
    });

    it("should not render pagination when page is missing", () => {
      render(<MovieAdminTable items={mockItems} setPage={mockSetPage} totalPages={5} />);
      expect(screen.queryByText(/Seite/)).not.toBeInTheDocument();
    });

    it("should not render pagination when setPage is missing", () => {
      render(<MovieAdminTable items={mockItems} page={2} totalPages={5} />);
      expect(screen.queryByText(/Seite/)).not.toBeInTheDocument();
    });

    it("should not render pagination when totalPages is missing", () => {
      render(<MovieAdminTable items={mockItems} page={2} setPage={mockSetPage} />);
      expect(screen.queryByText(/Seite/)).not.toBeInTheDocument();
    });

    it("should render previous button", () => {
      render(<MovieAdminTable items={mockItems} page={2} setPage={mockSetPage} totalPages={5} />);
      const prevButton = screen.getByText("<");
      expect(prevButton).toBeInTheDocument();
    });

    it("should render next button", () => {
      render(<MovieAdminTable items={mockItems} page={2} setPage={mockSetPage} totalPages={5} />);
      const nextButton = screen.getByText(">");
      expect(nextButton).toBeInTheDocument();
    });

    it("should disable previous button on first page", () => {
      render(<MovieAdminTable items={mockItems} page={1} setPage={mockSetPage} totalPages={5} />);
      const prevButton = screen.getByText("<");
      expect(prevButton).toBeDisabled();
    });

    it("should disable next button on last page", () => {
      render(<MovieAdminTable items={mockItems} page={5} setPage={mockSetPage} totalPages={5} />);
      const nextButton = screen.getByText(">");
      expect(nextButton).toBeDisabled();
    });

    it("should disable next button when totalPages is 0", () => {
      render(<MovieAdminTable items={mockItems} page={1} setPage={mockSetPage} totalPages={0} />);
      const nextButton = screen.getByText(">");
      expect(nextButton).toBeDisabled();
    });

    it("should call setPage with page-1 when clicking previous", () => {
      render(<MovieAdminTable items={mockItems} page={3} setPage={mockSetPage} totalPages={5} />);
      const prevButton = screen.getByText("<");
      fireEvent.click(prevButton);
      expect(mockSetPage).toHaveBeenCalledWith(2);
    });

    it("should call setPage with page+1 when clicking next", () => {
      render(<MovieAdminTable items={mockItems} page={3} setPage={mockSetPage} totalPages={5} />);
      const nextButton = screen.getByText(">");
      fireEvent.click(nextButton);
      expect(mockSetPage).toHaveBeenCalledWith(4);
    });
  });

  describe("Styling and Layout", () => {
    it("should have max-w-5xl container", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const mainDiv = container.querySelector(".max-w-5xl");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should have responsive flex layout for search", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const flexContainer = container.querySelector(".flex.flex-col.md\\:flex-row");
      expect(flexContainer).toBeInTheDocument();
    });

    it("should have rounded table container", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const tableContainer = container.querySelector(".rounded-2xl");
      expect(tableContainer).toBeInTheDocument();
    });

    it("should have hover effect on table rows", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const hoverRow = container.querySelector(".hover\\:bg-zinc-700\\/60");
      expect(hoverRow).toBeInTheDocument();
    });

    it("should apply focus styles to search input", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const searchInput = container.querySelector(".focus\\:ring-2");
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle items without actors array", () => {
      const itemsWithoutActors = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
        },
      ];
      render(<MovieAdminTable items={itemsWithoutActors} />);
      expect(screen.getByText("Movie")).toBeInTheDocument();
    });

    it("should handle items with null actors", () => {
      const itemsWithNullActors = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
          actors: null as any,
        },
      ];
      render(<MovieAdminTable items={itemsWithNullActors} />);
      expect(screen.getByText("Movie")).toBeInTheDocument();
    });

    it("should handle actors with undefined names", () => {
      const itemsWithUndefinedNames = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
          actors: [{ actor: { name: undefined } }],
        },
      ];
      render(<MovieAdminTable items={itemsWithUndefinedNames} />);
      expect(screen.getByText("Movie")).toBeInTheDocument();
    });

    it("should handle duplicate item IDs with index", () => {
      const duplicateItems = [
        {
          id: "1",
          title: "Movie A",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
          actors: [],
        },
        {
          id: "1",
          title: "Movie B",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
          actors: [],
        },
      ];
      const { container } = render(<MovieAdminTable items={duplicateItems} />);
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(2);
    });

    it("should handle empty search string", () => {
      render(<MovieAdminTable items={mockItems} />);
      const searchInput = screen.getByPlaceholderText("Search by title...");
      fireEvent.change(searchInput, { target: { value: "" } });
      expect(screen.getByText("Movie A")).toBeInTheDocument();
      expect(screen.getByText("Series B")).toBeInTheDocument();
    });

    it("should handle very long titles", () => {
      const itemsWithLongTitle = [
        {
          id: "1",
          title: "A".repeat(100),
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
          actors: [],
        },
      ];
      render(<MovieAdminTable items={itemsWithLongTitle} />);
      expect(screen.getByText("A".repeat(100))).toBeInTheDocument();
    });

    it("should handle zero views", () => {
      const itemsWithZeroViews = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 0,
          actors: [],
        },
      ];
      render(<MovieAdminTable items={itemsWithZeroViews} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should handle large view counts", () => {
      const itemsWithLargeViews = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 1000000,
          actors: [],
        },
      ];
      render(<MovieAdminTable items={itemsWithLargeViews} />);
      expect(screen.getByText("1000000")).toBeInTheDocument();
    });
  });

  describe("Type Safety", () => {
    it("should accept items with all required properties", () => {
      const validItems = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
        },
      ];
      expect(() => render(<MovieAdminTable items={validItems} />)).not.toThrow();
    });

    it("should accept optional actors property", () => {
      const itemsWithActors = [
        {
          id: "1",
          title: "Movie",
          type: "movie",
          createdAt: "2024-01-01T00:00:00Z",
          views: 100,
          actors: [{ actor: { name: "Actor" } }],
        },
      ];
      expect(() => render(<MovieAdminTable items={itemsWithActors} />)).not.toThrow();
    });

    it("should accept optional pagination props", () => {
      expect(() =>
        render(<MovieAdminTable items={mockItems} page={1} setPage={mockSetPage} totalPages={5} />)
      ).not.toThrow();
    });
  });

  describe("Component State", () => {
    it("should initialize search state as empty string", () => {
      render(<MovieAdminTable items={mockItems} />);
      const searchInput = screen.getByPlaceholderText("Search by title...") as HTMLInputElement;
      expect(searchInput.value).toBe("");
    });

    it("should initialize sortKey as title", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText(/Title ▲/)).toBeInTheDocument();
    });

    it("should initialize sortDirection as asc", () => {
      render(<MovieAdminTable items={mockItems} />);
      expect(screen.getByText(/▲/)).toBeInTheDocument();
    });
  });

  describe("Table Structure", () => {
    it("should have separate border spacing", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const table = container.querySelector(".border-separate");
      expect(table).toBeInTheDocument();
    });

    it("should have overflow-x-auto wrapper", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const wrapper = container.querySelector(".overflow-x-auto");
      expect(wrapper).toBeInTheDocument();
    });

    it("should render thead element", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const thead = container.querySelector("thead");
      expect(thead).toBeInTheDocument();
    });

    it("should render tbody element", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const tbody = container.querySelector("tbody");
      expect(tbody).toBeInTheDocument();
    });

    it("should have 6 columns", () => {
      const { container } = render(<MovieAdminTable items={mockItems} />);
      const headerCells = container.querySelectorAll("thead th");
      expect(headerCells.length).toBe(6);
    });
  });
});
