CREATE TYPE "QrDevicePairingStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'CONSUMED', 'EXPIRED');

CREATE TABLE "QrDevicePairingRequest" (
    "id" TEXT NOT NULL,
    "status" "QrDevicePairingStatus" NOT NULL DEFAULT 'PENDING',
    "environment" TEXT NOT NULL,
    "manualCodeHash" TEXT NOT NULL,
    "approvalSecretHash" TEXT NOT NULL,
    "pollSecretHash" TEXT NOT NULL,
    "exchangeSecretHash" TEXT,
    "approverUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrDevicePairingRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QrDevicePairingRequest_manualCodeHash_key" ON "QrDevicePairingRequest"("manualCodeHash");
CREATE UNIQUE INDEX "QrDevicePairingRequest_approvalSecretHash_key" ON "QrDevicePairingRequest"("approvalSecretHash");
CREATE UNIQUE INDEX "QrDevicePairingRequest_pollSecretHash_key" ON "QrDevicePairingRequest"("pollSecretHash");
CREATE UNIQUE INDEX "QrDevicePairingRequest_exchangeSecretHash_key" ON "QrDevicePairingRequest"("exchangeSecretHash");
CREATE INDEX "QrDevicePairingRequest_status_expiresAt_idx" ON "QrDevicePairingRequest"("status", "expiresAt");
CREATE INDEX "QrDevicePairingRequest_approverUserId_createdAt_idx" ON "QrDevicePairingRequest"("approverUserId", "createdAt");

CREATE TABLE "RecentAuthenticationGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentAuthenticationGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecentAuthenticationGrant_userId_sessionId_key" ON "RecentAuthenticationGrant"("userId", "sessionId");
CREATE INDEX "RecentAuthenticationGrant_expiresAt_idx" ON "RecentAuthenticationGrant"("expiresAt");

ALTER TABLE "QrDevicePairingRequest"
ADD CONSTRAINT "QrDevicePairingRequest_approverUserId_fkey"
FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RecentAuthenticationGrant"
ADD CONSTRAINT "RecentAuthenticationGrant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecentAuthenticationGrant"
ADD CONSTRAINT "RecentAuthenticationGrant_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "AuthSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
