ALTER TABLE "MediaIntegrityScanRun"
ADD COLUMN "lockKey" TEXT;

UPDATE "MediaIntegrityScanRun"
SET "lockKey" = CASE
    WHEN "scope" = 'CATALOG' THEN 'CATALOG'
    WHEN "requestedContentId" IS NOT NULL THEN 'CONTENT:' || "requestedContentId"
    ELSE NULL
END
WHERE "status" = 'RUNNING';

CREATE UNIQUE INDEX "MediaIntegrityScanRun_running_lock_key"
ON "MediaIntegrityScanRun"("lockKey")
WHERE "status" = 'RUNNING' AND "lockKey" IS NOT NULL;
