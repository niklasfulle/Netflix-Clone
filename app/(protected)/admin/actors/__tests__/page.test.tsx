import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminActorsPage from "../page";

// Mock SWR
jest.mock("swr", () => {
  return jest.fn((url: string) => {
    if (url === "/api/movies/all") {
      return {
        data: {
          movies: [
            { id: "1", title: "Movie 1" },
            { id: "2", title: "Movie 2" },
          ],
          total: 2,
        },
        error: undefined,
        isLoading: false,
      };
    }
    if (url === "/api/series/all") {
      return {
        data: [
          { id: "1", title: "Series 1" },
          { id: "2", title: "Series 2" },
        ],
        error: undefined,
        isLoading: false,
      };
    }
    return { data: undefined, error: undefined, isLoading: true };
  });
});

// Mock fetch globalThisly
globalThis.fetch = jest.fn();

describe("AdminActorsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockClear();
  });

  describe("Component Rendering", () => {
    it("renders the page title", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      expect(screen.getByText(/Actors Management/)).toBeInTheDocument();
    });

    it("renders the form with input field and submit button", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/New Actor Name/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Add/ })).toBeInTheDocument();
      });
    });

    it("renders initial loading state", async () => {
      let resolveFirstFetch: any;
      (globalThis.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstFetch = resolve;
        })
      );

      render(<AdminActorsPage />);
      expect(screen.getByText(/loading/)).toBeInTheDocument();

      resolveFirstFetch({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });
    });
  });

  describe("Actors Table Display", () => {
    it("displays table with actor data", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "John Doe",
              movieCount: 5,
              seriesCount: 3,
              views: 1000,
            },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
    });

    it("displays actor data in table rows", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "John Doe",
              movieCount: 5,
              seriesCount: 3,
              views: 1000,
            },
            {
              id: "2",
              name: "Jane Smith",
              movieCount: 2,
              seriesCount: 1,
              views: 500,
            },
          ],
          total: 2,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });

    it("displays correct movie count for each actor", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "Actor 1",
              movieCount: 7,
              seriesCount: 2,
              views: 999,
            },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      await waitFor(() => {
        expect(screen.getByText("7")).toBeInTheDocument();
      });
    });

    it("displays correct series count for each actor", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "Actor 1",
              movieCount: 2,
              seriesCount: 5,
              views: 750,
            },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    });

    it("displays correct views count for each actor", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "Actor 1",
              movieCount: 1,
              seriesCount: 1,
              views: 2500,
            },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      await waitFor(() => {
        expect(screen.getByText("2500")).toBeInTheDocument();
      });
    });

    it("shows empty state message when no actors exist", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      await waitFor(() => {
        expect(screen.getByText(/No actors available/)).toBeInTheDocument();
      });
    });
  });

  describe("Add Actor Form", () => {
    it("allows typing in the actor name input", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      const input = screen.getByPlaceholderText(/New Actor Name/) as HTMLInputElement;

      fireEvent.change(input, { target: { value: "Tom Hardy" } });
      expect(input.value).toBe("Tom Hardy");
    });

    it("successfully adds a new actor", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "3",
            name: "New Actor",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [
              {
                id: "3",
                name: "New Actor",
                movieCount: 0,
                seriesCount: 0,
                views: 0,
              },
            ],
            total: 1,
            totalPages: 1,
          }),
        });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/) as HTMLInputElement;
      const addButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.change(input, { target: { value: "New Actor" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Actor added/)).toBeInTheDocument();
      });
    });

    it("shows error when trying to add actor with empty name", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);
      const addButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Name must not be empty/)).toBeInTheDocument();
      });
    });

    it("clears input field after successful actor addition", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "4",
            name: "Test Actor",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [
              {
                id: "4",
                name: "Test Actor",
                movieCount: 0,
                seriesCount: 0,
                views: 0,
              },
            ],
            total: 1,
            totalPages: 1,
          }),
        });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/) as HTMLInputElement;
      const addButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.change(input, { target: { value: "Test Actor" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("handles API error when adding actor fails", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: "Actor already exists",
          }),
        });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/) as HTMLInputElement;
      const addButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.change(input, { target: { value: "Existing Actor" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Actor already exists/)).toBeInTheDocument();
      });
    });
  });

  describe("Delete Actor Functionality", () => {
    it("shows delete button only for actors with zero movies and series", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "Deletable Actor",
              movieCount: 0,
              seriesCount: 0,
              views: 0,
            },
            {
              id: "2",
              name: "Protected Actor",
              movieCount: 1,
              seriesCount: 0,
              views: 100,
            },
          ],
          total: 2,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
        expect(deleteButtons).toHaveLength(1);
      });
    });

    it("successfully deletes an actor", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [
              {
                id: "1",
                name: "Actor to Delete",
                movieCount: 0,
                seriesCount: 0,
                views: 0,
              },
            ],
            total: 1,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        });

      render(<AdminActorsPage />);

      const deleteButton = await screen.findByRole("button", { name: /Delete/ });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Actor deleted/)).toBeInTheDocument();
      });
    });

    it("hides delete button for actors with movies", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "Actor in Movies",
              movieCount: 3,
              seriesCount: 0,
              views: 500,
            },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      await waitFor(() => {
        const deleteButtons = screen.queryAllByRole("button", { name: /Delete/ });
        expect(deleteButtons).toHaveLength(0);
      });
    });

    it("hides delete button for actors with series", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "Actor in Series",
              movieCount: 0,
              seriesCount: 2,
              views: 300,
            },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      await waitFor(() => {
        const deleteButtons = screen.queryAllByRole("button", { name: /Delete/ });
        expect(deleteButtons).toHaveLength(0);
      });
    });
  });

  describe("Pagination", () => {
    it("renders pagination controls", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 50,
          totalPages: 3,
        }),
      });

      render(<AdminActorsPage />);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Data Fetching", () => {
    it("fetches actors on initial render", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/actors?page=1&pageSize=20")
        );
      });
    });
  });

  describe("Error and Success Messages", () => {
    it("clears previous error messages when adding actor", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "6",
            name: "Actor 1",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [
              {
                id: "6",
                name: "Actor 1",
                movieCount: 0,
                seriesCount: 0,
                views: 0,
              },
            ],
            total: 1,
            totalPages: 1,
          }),
        });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/) as HTMLInputElement;
      const addButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.change(input, { target: { value: "Actor 1" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Actor added/)).toBeInTheDocument();
      });
    });

    it("displays success message when actor added successfully", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "7",
            name: "New Actor",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [
              {
                id: "7",
                name: "New Actor",
                movieCount: 0,
                seriesCount: 0,
                views: 0,
              },
            ],
            total: 1,
            totalPages: 1,
          }),
        });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/) as HTMLInputElement;
      const addButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.change(input, { target: { value: "New Actor" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Actor added/)).toBeInTheDocument();
      });
    });

    it("displays success message when actor deleted successfully", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [
              {
                id: "1",
                name: "Actor to Delete",
                movieCount: 0,
                seriesCount: 0,
                views: 0,
              },
            ],
            total: 1,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        });

      render(<AdminActorsPage />);

      const deleteButton = await screen.findByRole("button", { name: /Delete/ });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Actor deleted/)).toBeInTheDocument();
      });
    });
  });

  describe("Loading and UI States", () => {
    it("shows loading state on initial load", async () => {
      let resolveFirstFetch: any;
      (globalThis.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstFetch = resolve;
        })
      );

      render(<AdminActorsPage />);
      expect(screen.getByText(/loading/)).toBeInTheDocument();

      resolveFirstFetch({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });
    });

    it("displays table when actors data is loaded", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [
            {
              id: "1",
              name: "John Doe",
              movieCount: 5,
              seriesCount: 3,
              views: 1000,
            },
          ],
          total: 1,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
    });
  });

  describe("UI Interactions", () => {
    it("changes input value when user types", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/) as HTMLInputElement;
      expect(input.value).toBe("");

      fireEvent.change(input, { target: { value: "Test" } });
      expect(input.value).toBe("Test");

      fireEvent.change(input, { target: { value: "Test Actor" } });
      expect(input.value).toBe("Test Actor");
    });

    it("submits form when submit button is clicked", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "8",
            name: "Form Test",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [
              {
                id: "8",
                name: "Form Test",
                movieCount: 0,
                seriesCount: 0,
                views: 0,
              },
            ],
            total: 1,
            totalPages: 1,
          }),
        });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/);
      const submitButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.change(input, { target: { value: "Form Test" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/actors",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Form Test" }),
          })
        );
      });
    });
  });

  describe("Movie and Series Data Display", () => {
    it("displays movies count in header", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Movies: 2/)).toBeInTheDocument();
      });
    });

    it("displays series count in header", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Series: 2/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("prevents form submission with only whitespace", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          actors: [],
          total: 0,
          totalPages: 1,
        }),
      });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/) as HTMLInputElement;
      const addButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Name must not be empty/)).toBeInTheDocument();
      });
    });

    it("submits form with valid non-whitespace input", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [],
            total: 0,
            totalPages: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "9",
            name: "Valid Actor",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            actors: [
              {
                id: "9",
                name: "Valid Actor",
                movieCount: 0,
                seriesCount: 0,
                views: 0,
              },
            ],
            total: 1,
            totalPages: 1,
          }),
        });

      render(<AdminActorsPage />);

      const input = screen.getByPlaceholderText(/New Actor Name/);
      const addButton = screen.getByRole("button", { name: /Add/ });

      fireEvent.change(input, { target: { value: "Valid Actor" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Actor added/)).toBeInTheDocument();
      });
    });
  });
});
