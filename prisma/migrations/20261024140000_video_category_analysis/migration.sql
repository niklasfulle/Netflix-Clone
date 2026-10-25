CREATE TABLE "VideoAnalysis" (
  "id" TEXT NOT NULL PRIMARY KEY, "movieId" TEXT NOT NULL, "requestedById" TEXT NOT NULL,
  "jobRunId" TEXT, "cacheKey" TEXT NOT NULL, "sourceFingerprint" TEXT NOT NULL, "model" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED', "durationSeconds" DOUBLE PRECISION,
  "sampleCount" INTEGER NOT NULL DEFAULT 0, "processedCount" INTEGER NOT NULL DEFAULT 0, "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3)
);
CREATE TABLE "VideoAnalysisSample" (
  "analysisId" TEXT NOT NULL, "index" INTEGER NOT NULL, "atSeconds" DOUBLE PRECISION NOT NULL, "tags" JSONB NOT NULL,
  PRIMARY KEY ("analysisId", "index")
);
CREATE TABLE "VideoCategorySuggestion" (
  "id" TEXT NOT NULL PRIMARY KEY, "analysisId" TEXT NOT NULL, "name" VARCHAR(80) NOT NULL,
  "normalizedName" TEXT NOT NULL, "confidence" DOUBLE PRECISION NOT NULL, "evidence" JSONB NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'PENDING', "categoryId" TEXT
);
CREATE UNIQUE INDEX "VideoAnalysis_jobRunId_key" ON "VideoAnalysis"("jobRunId");
CREATE UNIQUE INDEX "VideoAnalysis_cacheKey_key" ON "VideoAnalysis"("cacheKey");
CREATE INDEX "VideoAnalysis_movieId_createdAt_idx" ON "VideoAnalysis"("movieId", "createdAt");
CREATE UNIQUE INDEX "VideoCategorySuggestion_analysisId_normalizedName_key" ON "VideoCategorySuggestion"("analysisId", "normalizedName");
CREATE INDEX "VideoCategorySuggestion_categoryId_idx" ON "VideoCategorySuggestion"("categoryId");
ALTER TABLE "VideoAnalysis" ADD CONSTRAINT "VideoAnalysis_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VideoAnalysis" ADD CONSTRAINT "VideoAnalysis_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VideoAnalysisSample" ADD CONSTRAINT "VideoAnalysisSample_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "VideoAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VideoCategorySuggestion" ADD CONSTRAINT "VideoCategorySuggestion_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "VideoAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VideoCategorySuggestion" ADD CONSTRAINT "VideoCategorySuggestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
