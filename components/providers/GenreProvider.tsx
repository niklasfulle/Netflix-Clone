"use client";

import { createContext, type ReactNode, useContext } from "react";

const GenreContext = createContext<readonly string[]>([]);

interface GenreProviderProps {
  children: ReactNode;
  genres: readonly string[];
}

export function GenreProvider({ children, genres }: Readonly<GenreProviderProps>) {
  return <GenreContext.Provider value={genres}>{children}</GenreContext.Provider>;
}

export function useGenreOptions(): readonly string[] {
  return useContext(GenreContext);
}
