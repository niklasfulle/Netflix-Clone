ALTER TABLE "User"
ADD COLUMN "sessionsInvalidBefore" TIMESTAMP(3);

CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthSession_userId_revokedAt_idx"
ON "AuthSession"("userId", "revokedAt");

CREATE INDEX "AuthSession_expiresAt_idx"
ON "AuthSession"("expiresAt");

CREATE INDEX "SecurityActivity_userId_createdAt_idx"
ON "SecurityActivity"("userId", "createdAt");

CREATE INDEX "SecurityActivity_createdAt_idx"
ON "SecurityActivity"("createdAt");

ALTER TABLE "AuthSession"
ADD CONSTRAINT "AuthSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SecurityActivity"
ADD CONSTRAINT "SecurityActivity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
