-- Remove rows that cannot satisfy the new foreign keys. This is intentionally
-- done before deduplication so the unique indexes can be created safely.
DELETE FROM "MovieWatchTime" mwt
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = mwt."userId")
   OR NOT EXISTS (SELECT 1 FROM "Profil" p WHERE p."id" = mwt."profilId")
   OR NOT EXISTS (SELECT 1 FROM "Movie" m WHERE m."id" = mwt."movieId");

DELETE FROM "MovieView" mv
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = mv."userId")
   OR NOT EXISTS (SELECT 1 FROM "Profil" p WHERE p."id" = mv."profilId")
   OR NOT EXISTS (SELECT 1 FROM "Movie" m WHERE m."id" = mv."movieId");

DELETE FROM "Playlist" p
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = p."userId")
   OR NOT EXISTS (SELECT 1 FROM "Profil" pr WHERE pr."id" = p."profilId");

DELETE FROM "PlaylistEntry" pe
WHERE NOT EXISTS (SELECT 1 FROM "Playlist" p WHERE p."id" = pe."playlistId")
   OR NOT EXISTS (SELECT 1 FROM "Movie" m WHERE m."id" = pe."movieId");

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "userId", "profilId", "movieId"
    ORDER BY "time" DESC, "id"
  ) AS row_number
  FROM "MovieWatchTime"
)
DELETE FROM "MovieWatchTime" mwt
USING ranked
WHERE mwt."id" = ranked."id" AND ranked.row_number > 1;

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "playlistId", "movieId"
    ORDER BY "order", "createdAt", "id"
  ) AS row_number
  FROM "PlaylistEntry"
)
DELETE FROM "PlaylistEntry" pe
USING ranked
WHERE pe."id" = ranked."id" AND ranked.row_number > 1;

ALTER TABLE "MovieWatchTime"
  ADD CONSTRAINT "MovieWatchTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MovieWatchTime_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MovieWatchTime_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MovieView"
  ADD CONSTRAINT "MovieView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MovieView_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MovieView_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Playlist"
  ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Playlist_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlaylistEntry"
  ADD CONSTRAINT "PlaylistEntry_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "MovieWatchTime_userId_profilId_movieId_key" ON "MovieWatchTime"("userId", "profilId", "movieId");
CREATE INDEX "MovieWatchTime_profilId_movieId_idx" ON "MovieWatchTime"("profilId", "movieId");
CREATE INDEX "MovieWatchTime_movieId_idx" ON "MovieWatchTime"("movieId");
CREATE INDEX "MovieView_userId_profilId_createdAt_idx" ON "MovieView"("userId", "profilId", "createdAt");
CREATE INDEX "MovieView_movieId_createdAt_idx" ON "MovieView"("movieId", "createdAt");
CREATE INDEX "Playlist_userId_profilId_idx" ON "Playlist"("userId", "profilId");
CREATE UNIQUE INDEX "PlaylistEntry_playlistId_movieId_key" ON "PlaylistEntry"("playlistId", "movieId");
CREATE INDEX "PlaylistEntry_playlistId_order_idx" ON "PlaylistEntry"("playlistId", "order");
CREATE INDEX "PlaylistEntry_movieId_idx" ON "PlaylistEntry"("movieId");

-- Watchlist was historically created through `prisma db push`; create it for
-- fresh databases so the versioned migration history is complete.
CREATE TABLE IF NOT EXISTS "Watchlist" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profilId" TEXT NOT NULL,
  "movieId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Watchlist_id_key" ON "Watchlist"("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Watchlist_profilId_movieId_key" ON "Watchlist"("profilId", "movieId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Watchlist_userId_fkey') THEN
    ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Watchlist_profilId_fkey') THEN
    ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Watchlist_movieId_fkey') THEN
    ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
