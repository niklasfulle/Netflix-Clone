export const CATALOG_ACTOR_ROW_LIMIT = 12;

export type CatalogActorDto = string | {
  id?: string;
  name?: string;
  actor?: { id?: string; name?: string };
};

export type CatalogCardDto = {
  id?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  type?: string;
  genre?: string;
  actor?: string;
  actors?: CatalogActorDto[];
  duration?: string;
  createdAt?: string | Date;
  watchTime?: number;
};

export type CatalogItemDto = CatalogCardDto & {
  videoUrl?: string;
};

export const catalogThumbnailUrl = (movieId: string) =>
  `/api/catalog/thumbnails/${encodeURIComponent(movieId)}`;
