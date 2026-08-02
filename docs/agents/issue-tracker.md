# Issue tracker: GitHub

Issues, product requirements documents (PRDs), and Wayfinder maps for this
repository live in GitHub Issues under `niklasfulle/Netflix-Clone`.

Use the authenticated Codex GitHub connector for normal issue operations when
it is available. Outside Codex, use the GitHub CLI (`gh`) from this repository
clone. Never place a GitHub token in a command, repository file, issue, or chat.

## Conventions

- Create, read, list, comment on, label, assign, update, and close issues through
  the GitHub connector or the corresponding `gh issue` command.
- Infer the repository from the configured `origin` remote when using `gh`.
- Refer to issues by a descriptive linked title in human-facing text rather
  than only by their number.
- Put durable decisions in the resolving issue comment. Do not duplicate the
  full decision across multiple issues.

## Pull requests as a triage surface

**PRs as a request surface: no.** Pull requests are implementation artifacts,
not incoming feature or planning requests for the triage workflow.

GitHub shares one number space across issues and pull requests. Resolve the
object type before mutating a bare number.

## Publishing and fetching

When a skill says "publish to the issue tracker", create a GitHub issue in
`niklasfulle/Netflix-Clone`.

When a skill says "fetch the relevant ticket", load the issue body, labels,
assignees, relationships, and comments.

## Wayfinding operations

Wayfinder represents one planning effort as a map issue with decision tickets.

- **Map:** Create one issue labelled `wayfinder:map`. Its body contains the
  destination, notes, decisions so far, not-yet-specified areas, and explicit
  out-of-scope work.
- **Child ticket:** Prefer GitHub sub-issues. If the active integration cannot
  create sub-issues, add the ticket to a task list in the map and begin the
  ticket body with `Part of #<map>`.
- **Ticket type:** Apply exactly one of `wayfinder:research`,
  `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`.
- **Blocking:** Prefer GitHub's native issue dependencies. If unavailable, add
  `Blocked by: #<number>, ...` at the top of the blocked ticket and verify the
  referenced issues before treating the ticket as unblocked.
- **Frontier:** The next ticket is the first open, unblocked, unassigned child
  in map order.
- **Claim:** Assign the selected ticket to the developer driving the map before
  starting work.
- **Resolve:** Record the answer in a resolution comment, close the ticket, and
  append a short linked gist to the map's `Decisions so far` section.

Do not resolve more than one non-research Wayfinder ticket in a single session.
