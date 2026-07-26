CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "User"
ADD COLUMN "blockedAt" TIMESTAMP(3),
ADD COLUMN "blockedUntil" TIMESTAMP(3),
ADD COLUMN "blockedReason" TEXT;

ALTER TABLE "Movie"
ADD COLUMN "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Movie"
SET "publishedAt" = "createdAt"
WHERE "status" = 'PUBLISHED';

CREATE INDEX "Movie_type_status_idx" ON "Movie"("type", "status");
CREATE INDEX "Movie_createdAt_idx" ON "Movie"("createdAt");
