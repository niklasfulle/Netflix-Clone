CREATE TABLE "VideoExample" (
  "id" TEXT NOT NULL PRIMARY KEY, "movieId" TEXT NOT NULL, "requestId" TEXT NOT NULL,
  "sourceFingerprint" TEXT NOT NULL, "startSeconds" DOUBLE PRECISION NOT NULL,
  "endSeconds" DOUBLE PRECISION NOT NULL, "labels" JSONB NOT NULL,
  "note" VARCHAR(500) NOT NULL DEFAULT '', "reviewerId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VideoExample_time_range_check" CHECK ("startSeconds" >= 0 AND "endSeconds" > "startSeconds" AND "endSeconds" <= 86400),
  CONSTRAINT "VideoExample_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "VideoExample_requestId_key" ON "VideoExample"("requestId");
CREATE INDEX "VideoExample_movieId_startSeconds_idx" ON "VideoExample"("movieId", "startSeconds");
