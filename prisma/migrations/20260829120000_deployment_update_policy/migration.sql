CREATE TABLE "DeploymentUpdatePolicy" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "automaticReloadEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeploymentUpdatePolicy_pkey" PRIMARY KEY ("id")
);
