CREATE TABLE "OperationalLease" (
    "resourceKey" TEXT NOT NULL,
    "ownerTokenHash" TEXT,
    "fencingToken" BIGINT NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalLease_pkey" PRIMARY KEY ("resourceKey")
);

CREATE INDEX "OperationalLease_expiresAt_idx" ON "OperationalLease"("expiresAt");
