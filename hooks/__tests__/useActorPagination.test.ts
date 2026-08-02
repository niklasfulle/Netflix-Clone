import { act, renderHook, waitFor } from "@testing-library/react";

import { useActorPagination } from "@/hooks/catalog/useActorPagination";
import { useCatalogQuery } from "@/hooks/catalog/useCatalogQuery";

jest.mock("@/hooks/catalog/useCatalogQuery", () => ({
  STATIC_CATALOG_OPTIONS: {},
  useCatalogQuery: jest.fn(),
}));

const mockUseCatalogQuery = jest.mocked(useCatalogQuery);

describe("useActorPagination", () => {
  let actorPage: string[];

  beforeEach(() => {
    actorPage = ["Actor 1", "Actor 2", "Actor 3"];
    mockUseCatalogQuery.mockImplementation((_content, query) => {
      if (query.kind === "actorCount") {
        return { data: 8, error: undefined, isLoading: false };
      }
      return { data: actorPage, error: undefined, isLoading: false };
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("requests the first actor page and reports more results", async () => {
    const { result } = renderHook(() => useActorPagination("movies"));

    await waitFor(() => expect(result.current.actors).toEqual(actorPage));
    expect(mockUseCatalogQuery).toHaveBeenCalledWith(
      "movies",
      { kind: "actors", start: 0, limit: 3 },
      expect.any(Object),
    );
    expect(result.current.hasMore).toBe(true);
  });

  it("loads subsequent pages and de-duplicates actor names", async () => {
    const { result } = renderHook(() => useActorPagination("series"));
    await waitFor(() => expect(result.current.actors).toHaveLength(3));

    actorPage = ["Actor 3", "Actor 4", "Actor 5"];
    act(() => result.current.loadMore());

    await waitFor(() => {
      expect(mockUseCatalogQuery).toHaveBeenCalledWith(
        "series",
        { kind: "actors", start: 3, limit: 5 },
        expect.any(Object),
      );
      expect(result.current.actors).toEqual([
        "Actor 1",
        "Actor 2",
        "Actor 3",
        "Actor 4",
        "Actor 5",
      ]);
    });
  });

  it("stops offering pagination when every actor is loaded", async () => {
    mockUseCatalogQuery.mockImplementation((_content, query) => {
      if (query.kind === "actorCount") {
        return { data: 3, error: undefined, isLoading: false };
      }
      return { data: actorPage, error: undefined, isLoading: false };
    });

    const { result } = renderHook(() => useActorPagination("movies"));
    await waitFor(() => expect(result.current.hasMore).toBe(false));
  });
});
