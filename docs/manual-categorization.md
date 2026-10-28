# Manual video categorization

Open **Administration → Video analysis**. This mode is entirely manual and does
not use model services, model jobs, predictions, or training examples.

Volume, mute, and playback speed are stored independently from normal playback.
Existing playback preferences stay with the regular player; the categorization
player starts at normal speed and full volume, with sound enabled, until its own
preferences are changed. Each mode remembers its settings across videos.

The next random item is a non-archived Movie or Series file without whole-video
categories, category intervals, or an explicitly completed categorization review.
**Skip video** selects another eligible item where one exists. The displayed
count includes all eligible items; the active item may still be included until saved.

- **Video categories** apply to the entire item and use the existing category assignments.
- **Category intervals** have a start and end and one or more selected categories.
  Add each interval to the draft before saving. Times accept seconds or
  `HH:MM:SS.mmm`; the end must follow the start and remain within the actual video.
- **Save** persists both assignment scopes and keeps the same video open.
- **Save and next video** also marks the review complete, including when no
  category applies, then chooses another video.

The same category can be assigned globally and to multiple intervals. Intervals
can overlap, be edited, removed, or clicked to seek to their start. They are
start-inclusive and end-exclusive. The player shows the category names and ranges
in both review and normal playback, including playlist playback.

Open an existing item again with the category action in content management or
`/admin/video-analysis?movieId=<id>`. There are at most 50 global categories and
200 intervals per item. Writes require administrator access, are transactional,
and reject an outdated review version rather than overwriting another editor.
Normal content edits also advance that revision. Interval ends are checked
against ffprobe metadata; the database enforces valid time ranges and cascading
references. Review playback does not record views or personal playback progress.

The additive migration is
`20261027140000_manual_category_segments`. Apply it before starting the updated
application. No initialization or reseeding is required. Existing global
categories and private legacy data are preserved. Runtime category names and
assignments belong in the database; exports and fixtures containing private
catalog data must remain outside Git and Docker images.

## Category colors

Category colors can be edited under **Administration → Categories → Edit category**.
Choose a palette swatch or a custom color; the stored color is used in the player
timeline. Category badges and selections do not display category colors. New categories prefer unused
colors from a contrasting palette. Renaming or reordering categories does not
change their stored color.

Apply migration `20261028120000_category_colors` before deploying this feature.
It adds an optional color and assigns persistent palette defaults to existing
categories without changing assignments. Category exports include stored colors;
older JSON exports remain compatible and preserve existing colors on import.

Local integration check after updating the schema and containers:

```powershell
node scripts/test-manual-categorization-local.mjs
```

This uses a neutral generated video and removes only its own fixtures.
