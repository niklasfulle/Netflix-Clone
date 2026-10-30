# Performance budgets

## Initial catalog payload

The initial `/movies` view must transfer no more than **250 KB of catalog
JSON** on a 390 × 844 viewport. This budget includes `/api/movies/newMovies`
and actor-row API responses started before the page reaches network idle.

Catalog-card JSON must not contain `videoUrl` or inline `data:image` payloads.
Thumbnails are fetched through `/api/catalog/thumbnails/{movieId}` and resized
by the Next.js image pipeline for the rendered viewport.

The two homepage random-card responses (`/api/movies/random?count=20` and
`/api/series/random?count=20`) together must stay within **50 KB of JSON**.
The administrator content table also uses thumbnail URLs and an explicit field
selection, while content editing and playback continue to load their full details
through their own endpoints.

On the homepage, initial catalog sections settle together before optional
Continue Watching and Favorites sections are inserted. Grid placeholders reserve
the same responsive card heights and gaps as loaded cards. Actor rows reserve the
same header and track height while loading. Avoid fixed `contain-intrinsic-size`
estimates on these sections: incorrect estimates moved visible content during
mobile scrolling and loading.

The Playwright scenario `tests/e2e/catalog-performance.spec.ts` enforces this
budget with Fast-4G-style network throttling and 4× CPU throttling in Chrome.

Production measurement on 2026-08-02:

- Catalog JSON: 6,063 bytes across four initial responses.
- LCP: 1,512 ms.
- CLS: 0.008.

Targets retained for manual release profiling:

- LCP at or below 2.5 seconds.
- CLS at or below 0.1.
