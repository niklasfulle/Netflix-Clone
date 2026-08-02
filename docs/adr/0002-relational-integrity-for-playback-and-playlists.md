# 0002: Relational integrity for playback and playlists

- Status: Accepted
- Date: 2026-08-01

## Context

Playback progress and playlist entries previously relied on application code
to keep references valid and entries unique. Concurrent requests or deleted
content could therefore leave duplicates and orphaned rows. Adding database
constraints to an existing installation requires cleaning legacy data before
the constraints are created.

## Decision

Playback and playlist records use explicit Prisma relations, intentional
cascade behavior, uniqueness constraints, and indexes that match their access
patterns. The versioned migration removes invalid or orphaned rows and resolves
duplicates before enabling the new constraints.

Playlist mutations are executed as a database transaction. Ownership is
checked before mutation, ordering is written explicitly, and removed entries
are deleted within the same transaction.

## Consequences

- Duplicate playlist and playback records are rejected by the database.
- Deleting a parent record intentionally removes its dependent records.
- Legacy cleanup is part of the migration and must run behind the verified
  backup described in ADR 0001.
- Rolling the database back across this migration may require restoring the
  pre-deployment backup rather than only reverting the application image.

