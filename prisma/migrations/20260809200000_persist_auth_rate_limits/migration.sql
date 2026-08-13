CREATE TABLE "AuthRateLimit" (
  "scope" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("scope", "subjectType", "subjectHash")
);

CREATE INDEX "AuthRateLimit_resetAt_idx" ON "AuthRateLimit"("resetAt");
