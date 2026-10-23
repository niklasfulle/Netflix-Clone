import { createEmptySearchResults, getSearchContentTypes } from '../search';

it('defaults to films and series when content types have not been configured', () => {
  const original = process.env.NEXT_PUBLIC_TYPE;
  try {
    delete process.env.NEXT_PUBLIC_TYPE;
    expect(getSearchContentTypes()).toEqual(['Movie', 'Serie']);
    expect(createEmptySearchResults()).toEqual({ actors: [], content: { Movie: [], Serie: [] } });
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_TYPE;
    else process.env.NEXT_PUBLIC_TYPE = original;
  }
});

it('normalizes configured categories and preserves unknown content categories', () => {
  expect(getSearchContentTypes('Movie, Documentary, Movie, , Serie')).toEqual(['Movie', 'Documentary', 'Serie']);
  expect(getSearchContentTypes(' , ')).toEqual(['Movie', 'Serie']);
  expect(createEmptySearchResults(['Documentary'])).toEqual({ actors: [], content: { Documentary: [] } });
});
