CREATE TABLE "CatalogDataState" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "mode" TEXT NOT NULL DEFAULT 'demo',
    "snapshotId" TEXT,
    "importedAt" TIMESTAMP(3),
    CONSTRAINT "CatalogDataState_pkey" PRIMARY KEY ("id")
);
