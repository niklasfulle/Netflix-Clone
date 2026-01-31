import { renderHook } from "@testing-library/react";
import { useAdminCounts } from "../useAdminCounts";

// Mock SWR
jest.mock("swr");

import useSWR from "swr";

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

describe("useAdminCounts Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should return counts and loading state", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [{ id: "1", name: "Actor 1" }] } as any)
        .mockReturnValueOnce({ data: [{ id: "1", title: "Movie 1" }] } as any)
        .mockReturnValueOnce({ data: [{ id: "1", title: "Series 1" }] } as any)
        .mockReturnValueOnce({ data: { totalViews: 100 } } as any);

      const { result } = renderHook(() => useAdminCounts());

      expect(result.current.actorsCount).toBe(1);
      expect(result.current.moviesCount).toBe(1);
      expect(result.current.seriesCount).toBe(1);
      expect(result.current.totalViews).toBe(100);
      expect(result.current.isLoading).toBe(false);
    });

    it("should fetch actors from correct endpoint", () => {
      mockUseSWR.mockReturnValue({ data: [] } as any);
      renderHook(() => useAdminCounts());

      expect(mockUseSWR).toHaveBeenCalledWith(
        "/api/actors",
        expect.any(Function)
      );
    });

    it("should fetch movies from correct endpoint", () => {
      mockUseSWR.mockReturnValue({ data: [] } as any);
      renderHook(() => useAdminCounts());

      expect(mockUseSWR).toHaveBeenCalledWith(
        "/api/movies/all",
        expect.any(Function)
      );
    });

    it("should fetch series from correct endpoint", () => {
      mockUseSWR.mockReturnValue({ data: [] } as any);
      renderHook(() => useAdminCounts());

      expect(mockUseSWR).toHaveBeenCalledWith(
        "/api/series/all",
        expect.any(Function)
      );
    });

    it("should fetch stats from correct endpoint", () => {
      mockUseSWR.mockReturnValue({ data: [] } as any);
      renderHook(() => useAdminCounts());

      expect(mockUseSWR).toHaveBeenCalledWith(
        "/api/statistics/admin-overview",
        expect.any(Function)
      );
    });
  });

  describe("Loading State", () => {
    it("should return isLoading true when actors is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: undefined } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading true when movies is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: undefined } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading true when series is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: undefined } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading true when stats is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: undefined } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading false when all data is loaded", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.isLoading).toBe(false);
    });

    it("should return isLoading true when all data is undefined", () => {
      mockUseSWR.mockReturnValue({ data: undefined } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("Actors Count", () => {
    it("should return correct count for actors array", () => {
      mockUseSWR
        .mockReturnValueOnce({
          data: [
            { id: "1", name: "Actor 1" },
            { id: "2", name: "Actor 2" },
            { id: "3", name: "Actor 3" },
          ],
        } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.actorsCount).toBe(3);
    });

    it("should return 0 when actors is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: undefined } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.actorsCount).toBe(0);
    });

    it("should return 0 when actors is null", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: null } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.actorsCount).toBe(0);
    });

    it("should return 0 when actors is empty array", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.actorsCount).toBe(0);
    });
  });

  describe("Movies Count", () => {
    it("should return correct count for movies array", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({
          data: [
            { id: "1", title: "Movie 1" },
            { id: "2", title: "Movie 2" },
          ],
        } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.moviesCount).toBe(2);
    });

    it("should return 0 when movies is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: undefined } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.moviesCount).toBe(0);
    });

    it("should return 0 when movies is null", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: null } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.moviesCount).toBe(0);
    });

    it("should return 0 when movies is empty array", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.moviesCount).toBe(0);
    });
  });

  describe("Series Count", () => {
    it("should return correct count for series array", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({
          data: [
            { id: "1", title: "Series 1" },
            { id: "2", title: "Series 2" },
            { id: "3", title: "Series 3" },
            { id: "4", title: "Series 4" },
          ],
        } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.seriesCount).toBe(4);
    });

    it("should return 0 when series is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: undefined } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.seriesCount).toBe(0);
    });

    it("should return 0 when series is null", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: null } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.seriesCount).toBe(0);
    });

    it("should return 0 when series is empty array", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.seriesCount).toBe(0);
    });
  });

  describe("Total Views", () => {
    it("should return correct total views", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 12345 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.totalViews).toBe(12345);
    });

    it("should return 0 when stats is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: undefined } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.totalViews).toBe(0);
    });

    it("should return 0 when stats is null", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: null } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.totalViews).toBe(0);
    });

    it("should return 0 when totalViews is undefined", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: {} } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.totalViews).toBe(0);
    });

    it("should return 0 when totalViews is null", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: null } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.totalViews).toBe(0);
    });

    it("should handle zero views", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.totalViews).toBe(0);
    });

    it("should handle large view counts", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 1000000 } } as any);

      const { result } = renderHook(() => useAdminCounts());
      expect(result.current.totalViews).toBe(1000000);
    });
  });

  describe("Return Object Structure", () => {
    it("should return object with all required properties", () => {
      mockUseSWR.mockReturnValue({ data: [] } as any);
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());

      expect(result.current).toHaveProperty("actorsCount");
      expect(result.current).toHaveProperty("moviesCount");
      expect(result.current).toHaveProperty("seriesCount");
      expect(result.current).toHaveProperty("totalViews");
      expect(result.current).toHaveProperty("isLoading");
    });

    it("should return numbers for all count properties", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [{ id: "1", name: "Actor" }] } as any)
        .mockReturnValueOnce({ data: [{ id: "1", title: "Movie" }] } as any)
        .mockReturnValueOnce({ data: [{ id: "1", title: "Series" }] } as any)
        .mockReturnValueOnce({ data: { totalViews: 100 } } as any);

      const { result } = renderHook(() => useAdminCounts());

      expect(typeof result.current.actorsCount).toBe("number");
      expect(typeof result.current.moviesCount).toBe("number");
      expect(typeof result.current.seriesCount).toBe("number");
      expect(typeof result.current.totalViews).toBe("number");
    });

    it("should return boolean for isLoading", () => {
      mockUseSWR.mockReturnValue({ data: [] } as any);
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      const { result } = renderHook(() => useAdminCounts());

      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("Edge Cases", () => {
    it("should handle all data sources with large datasets", () => {
      const largeActors = new Array(1000)
        .fill(0)
        .map((_, i) => ({ id: `${i}`, name: `Actor ${i}` }));
      const largeMovies = new Array(500)
        .fill(0)
        .map((_, i) => ({ id: `${i}`, title: `Movie ${i}` }));
      const largeSeries = new Array(200)
        .fill(0)
        .map((_, i) => ({ id: `${i}`, title: `Series ${i}` }));

      mockUseSWR
        .mockReturnValueOnce({ data: largeActors } as any)
        .mockReturnValueOnce({ data: largeMovies } as any)
        .mockReturnValueOnce({ data: largeSeries } as any)
        .mockReturnValueOnce({ data: { totalViews: 5000000 } } as any);

      const { result } = renderHook(() => useAdminCounts());

      expect(result.current.actorsCount).toBe(1000);
      expect(result.current.moviesCount).toBe(500);
      expect(result.current.seriesCount).toBe(200);
      expect(result.current.totalViews).toBe(5000000);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle single items in arrays", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [{ id: "1", name: "Actor" }] } as any)
        .mockReturnValueOnce({ data: [{ id: "1", title: "Movie" }] } as any)
        .mockReturnValueOnce({ data: [{ id: "1", title: "Series" }] } as any)
        .mockReturnValueOnce({ data: { totalViews: 1 } } as any);

      const { result } = renderHook(() => useAdminCounts());

      expect(result.current.actorsCount).toBe(1);
      expect(result.current.moviesCount).toBe(1);
      expect(result.current.seriesCount).toBe(1);
      expect(result.current.totalViews).toBe(1);
    });

    it("should handle mixed loading states", () => {
      mockUseSWR
        .mockReturnValueOnce({ data: [{ id: "1", name: "Actor" }] } as any)
        .mockReturnValueOnce({ data: undefined } as any)
        .mockReturnValueOnce({ data: [{ id: "1", title: "Series" }] } as any)
        .mockReturnValueOnce({ data: { totalViews: 100 } } as any);

      const { result } = renderHook(() => useAdminCounts());

      expect(result.current.actorsCount).toBe(1);
      expect(result.current.moviesCount).toBe(0);
      expect(result.current.seriesCount).toBe(1);
      expect(result.current.totalViews).toBe(100);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("SWR Integration", () => {
    it("should call useSWR four times", () => {
      mockUseSWR.mockReturnValue({ data: [] } as any);
      mockUseSWR
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: [] } as any)
        .mockReturnValueOnce({ data: { totalViews: 0 } } as any);

      renderHook(() => useAdminCounts());

      expect(mockUseSWR).toHaveBeenCalledTimes(4);
    });

    it("should use correct fetcher function signature", () => {
      mockUseSWR.mockReturnValue({ data: [] } as any);
      renderHook(() => useAdminCounts());

      // Check that all calls have a fetcher function
      expect(mockUseSWR.mock.calls[0][1]).toBeInstanceOf(Function);
      expect(mockUseSWR.mock.calls[1][1]).toBeInstanceOf(Function);
      expect(mockUseSWR.mock.calls[2][1]).toBeInstanceOf(Function);
      expect(mockUseSWR.mock.calls[3][1]).toBeInstanceOf(Function);
    });
  });
});
