jest.mock("server-only", () => ({}));

import {
  DEVELOPMENT_GENRES,
  getSelectableGenres,
  isGenreAllowed,
  parseGenreOptions,
} from "@/lib/genres";

describe("genre configuration", () => {
  it('uses runtime genre settings when arguments are omitted', () => {
    const environment = jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production', NEXT_PUBLIC_GENRE: 'Drama' });
    try {
      expect(getSelectableGenres()).toEqual(['Drama']);
      expect(isGenreAllowed('Drama')).toBe(true);
      expect(isGenreAllowed('Action')).toBe(false);
      expect(parseGenreOptions(undefined)).toEqual([]);
    } finally { environment.restore(); }
  });
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
