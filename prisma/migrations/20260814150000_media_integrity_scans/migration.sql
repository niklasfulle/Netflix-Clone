CREATE TABLE "MediaIntegrityScanRun" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "requestedContentId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "contentCount" INTEGER NOT NULL DEFAULT 0,
    "findingCount" INTEGER NOT NULL DEFAULT 0,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MediaIntegrityScanRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaIntegrityFinding" (
    "id" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "contentId" TEXT,
    "resourceKind" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaIntegrityFinding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MediaIntegrityScanRun_startedAt_idx"
ON "MediaIntegrityScanRun"("startedAt");

CREATE INDEX "MediaIntegrityScanRun_status_startedAt_idx"
ON "MediaIntegrityScanRun"("status", "startedAt");

CREATE INDEX "MediaIntegrityFinding_scanRunId_severity_idx"
ON "MediaIntegrityFinding"("scanRunId", "severity");

CREATE INDEX "MediaIntegrityFinding_contentId_createdAt_idx"
ON "MediaIntegrityFinding"("contentId", "createdAt");

CREATE INDEX "MediaIntegrityFinding_code_createdAt_idx"
ON "MediaIntegrityFinding"("code", "createdAt");

ALTER TABLE "MediaIntegrityFinding"
ADD CONSTRAINT "MediaIntegrityFinding_scanRunId_fkey"
FOREIGN KEY ("scanRunId") REFERENCES "MediaIntegrityScanRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
