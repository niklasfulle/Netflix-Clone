jest.mock("server-only", () => ({}));

import {
  DEVELOPMENT_GENRES,
  getSelectableGenres,
  isGenreAllowed,
  parseGenreOptions,
} from "@/lib/genres";

describe("genre configuration", () => {
  it("trims values and removes empty entries and duplicates", () => {
    expect(parseGenreOptions(" Action,Drama, Action, ,Comedy ")).toEqual([
      "Action",
      "Drama",
      "Comedy",
    ]);
  });

  it("uses configured genres in production", () => {
    expect(getSelectableGenres("production", "Action,Drama")).toEqual([
      "Action",
      "Drama",
    ]);
  });

  it("fails closed when no production genres are configured", () => {
    expect(getSelectableGenres("production", "  , ")).toEqual([]);
  });

  it("uses development defaults outside production", () => {
    expect(getSelectableGenres("development", "")).toEqual([
      ...DEVELOPMENT_GENRES,
    ]);
  });

  it("allows only configured genres in production", () => {
    expect(isGenreAllowed("Drama", "production", "Action,Drama")).toBe(true);
    expect(isGenreAllowed("Comedy", "production", "Action,Drama")).toBe(false);
  });

  it("does not restrict development values", () => {
    expect(isGenreAllowed("Custom", "development", "")).toBe(true);
  });
});
