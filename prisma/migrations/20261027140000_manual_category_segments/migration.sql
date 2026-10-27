ALTER TABLE "Movie"
  ADD COLUMN "categoryReviewVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "categoryReviewedAt" TIMESTAMP(3);

CREATE INDEX "Movie_status_categoryReviewedAt_idx" ON "Movie"("status", "categoryReviewedAt");

CREATE TABLE "MovieCategorySegment" (
  "id" TEXT NOT NULL,
  "movieId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "startSeconds" DOUBLE PRECISION NOT NULL,
  "endSeconds" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MovieCategorySegment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MovieCategorySegment_time_range_check" CHECK (
    "startSeconds" >= 0 AND "endSeconds" > "startSeconds" AND "endSeconds" <= 604800
  ),
  CONSTRAINT "MovieCategorySegment_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MovieCategorySegment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MovieCategorySegment_range_key"
  ON "MovieCategorySegment"("movieId", "categoryId", "startSeconds", "endSeconds");
CREATE INDEX "MovieCategorySegment_movieId_startSeconds_idx" ON "MovieCategorySegment"("movieId", "startSeconds");
CREATE INDEX "MovieCategorySegment_categoryId_idx" ON "MovieCategorySegment"("categoryId");
