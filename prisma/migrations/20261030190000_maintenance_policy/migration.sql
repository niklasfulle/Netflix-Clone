CREATE TABLE "MaintenancePolicy" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "bannerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3),
    "loginLocked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaintenancePolicy_pkey" PRIMARY KEY ("id")
);
