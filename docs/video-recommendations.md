# End-of-video recommendations

The normal player prepares up to six suggestions when playback enters the final
120 seconds. Videos no longer than 120 seconds prepare immediately once their
duration is known. The selection is fetched once for the active playback session,
retained after seeking backwards and never refreshed merely because playback
ends. The manual categorization player does not request recommendations.

Thumbnail elements are mounted with eager loading while the recommendation panel
is hidden. At completion, the existing panel and image elements are revealed.
No recommendation request or new image elements are initiated by the ended event.
A slow or unavailable network can still prevent preparation from finishing;
failure leaves a usable end screen and existing playlist controls.

## Initial rules

- Only published Movies and Series files are candidates. The current item is
  excluded and every result appears once. A small catalog can yield fewer than six.
- Global categories and interval categories form one set. Repeated or overlapping
  intervals never multiply the weight of a category.
- Similarity is weighted Jaccard overlap. Initially every category has weight 1.
- The first two slots prefer titles with shared actors. If a pair shares the same
  actor from the source video, that pair is preferred. Otherwise available shared-
  actor titles are used; missing actor matches cannot be invented.
- Primary-slot actor weight starts at 4; category weight starts at 1. Remaining
  slots use category weight 1 and a small shared-actor contribution of 0.2.
- Equal scores use recency and a stable identifier tie-break. Recent published
  titles fill remaining slots where there are no actor or category matches.

These are adjustable initial rules, not a learned model. The pure ranking module
`lib/recommendations/ranking.ts` accepts category weights by stable ID and separate
primary and secondary actor weights. Later tuning can compare variants without
changing playback, transport, or storing private category names in source files.
No category-specific weights are finalized and no administration editor for them
is introduced in this version.

Candidate collection is bounded: up to 40 published titles per source actor,
600 category-related titles, and six recent fallback titles. Per-actor collection
preserves the two-actor-match opportunity even in a large category pool.
Recommendations require an authenticated viewer and a published source. Responses
are private and uncached, contain only display metadata and catalog thumbnail
routes, and are held in memory for the active video. Video changes abort pending
requests so earlier responses cannot replace the new video's selection.

Playlist autoplay remains available on the completion screen. Choosing a
recommendation cancels the playlist countdown and opens that title normally.
