import type { CatalogItemDto } from '@/lib/catalog';

export const MIN_SEARCH_LENGTH = 3;
export const SEARCH_RESULT_LIMIT = 12;

const DEFAULT_SEARCH_CONTENT_TYPES = ['Movie', 'Serie'];

export type SearchActorDto = {
  id: string;
  name: string;
};

export type SearchResultsDto = {
  actors: SearchActorDto[];
  content: Record<string, CatalogItemDto[]>;
};

export function getSearchContentTypes(rawValue = process.env.NEXT_PUBLIC_TYPE): string[] {
  const configuredTypes = rawValue
    ?.split(',')
    .map((type) => type.trim())
    .filter(Boolean);

  return configuredTypes?.length
    ? [...new Set(configuredTypes)]
    : DEFAULT_SEARCH_CONTENT_TYPES;
}

export function createEmptySearchResults(contentTypes = getSearchContentTypes()): SearchResultsDto {
  return {
    actors: [],
    content: Object.fromEntries(contentTypes.map((type) => [type, []])),
  };
}
