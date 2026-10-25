# Local video evaluation

Open **Administration → Video analysis → Compare marked segments**. The same
link is available in the segment editor. Save explicit present/absent category
judgments, then start a comparison. Up to 500 saved segments are supported;
uncertain-only segments are excluded. The page retains the ten latest runs.

Each background run snapshots example versions, labels, source fingerprints,
category vocabulary, model profile and confidence threshold. Three frames are
sampled strictly inside each interval. Judgments and notes are never supplied
to the model. Inference uses the same classifier as catalog analysis and shares
its GPU lease. No videos, frames, examples or evaluation results are committed
to source control. Only the generic evaluation implementation is versioned.

Results are computed only for explicitly reviewed categories:

- Present + predicted: true positive (correctly recognized).
- Present + not predicted: false negative (missed).
- Absent + predicted: false positive (false suggestion).
- Absent + not predicted: true negative (correctly absent).

Uncertain human judgments and unreviewed model predictions are excluded.
Model abstention produces no predictions, so present categories are missed.
German and English names are normalized for matching. Predictions below the
saved threshold do not count. Precision is TP / (TP + FP), recall is
TP / (TP + FN), and F1 is 2TP / (2TP + FP + FN). Undefined denominators display
an em dash. Counts represent segment/category judgments, not whole videos.

Changed or missing sources are skipped and do not contribute to metrics.
Cancelled or failed runs show partial results. Failed jobs can resume without
repeating completed samples if their model profile is still current; otherwise
start a new run. Results remain attached to their original judgment snapshots
when examples are later edited or deleted. No category assignments are changed.

This is an evaluation facility, not automatic training. All segments of one
video belong to one dataset group. Future tuning and validation must use
different videos to avoid misleading improvements caused by overlapping data.
The initial dataset is a diagnostic baseline, not evidence of general accuracy.

For the local Docker stack, rebuild the shared app image, apply the additive
schema and queue changes through the `init` service without seeding, then
recreate `app` and `jobs-worker`. Existing media and database volumes are kept.
