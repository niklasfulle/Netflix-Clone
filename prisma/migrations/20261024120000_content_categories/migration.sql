CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovieCategory" (
    "movieId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "MovieCategory_pkey" PRIMARY KEY ("movieId", "categoryId")
);

CREATE UNIQUE INDEX "Category_normalizedName_key" ON "Category"("normalizedName");
CREATE INDEX "MovieCategory_categoryId_idx" ON "MovieCategory"("categoryId");
ALTER TABLE "MovieCategory" ADD CONSTRAINT "MovieCategory_movieId_fkey"
    FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieCategory" ADD CONSTRAINT "MovieCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
