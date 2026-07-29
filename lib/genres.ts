import "server-only";

export const DEVELOPMENT_GENRES = ["Action", "Comedy", "Drama"] as const;

export function parseGenreOptions(value: string | undefined): string[] {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean),
    ),
  );
}

export function getSelectableGenres(
  nodeEnv = process.env.NODE_ENV,
  configuredGenres = process.env["NEXT_PUBLIC_GENRE"],
): string[] {
  const genres = parseGenreOptions(configuredGenres);

  if (genres.length > 0) {
    return genres;
  }

  return nodeEnv === "production" ? [] : [...DEVELOPMENT_GENRES];
}

export function isGenreAllowed(
  genre: string,
  nodeEnv = process.env.NODE_ENV,
  configuredGenres = process.env["NEXT_PUBLIC_GENRE"],
): boolean {
  if (nodeEnv !== "production") {
    return true;
  }

  return parseGenreOptions(configuredGenres).includes(genre);
}
