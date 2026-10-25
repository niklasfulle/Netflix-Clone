ALTER TABLE "VideoEvaluationSample"
  ADD COLUMN "diagnostics" JSONB,
  ADD COLUMN "inspection" JSONB,
  ADD COLUMN "inspectionVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "VideoEvaluationFrame" (
  "sampleId" TEXT NOT NULL,
  "index" INTEGER NOT NULL,
  "atSeconds" DOUBLE PRECISION NOT NULL,
  "sha256" TEXT NOT NULL,
  "jpeg" BYTEA NOT NULL,
  CONSTRAINT "VideoEvaluationFrame_pkey" PRIMARY KEY ("sampleId", "index"),
  CONSTRAINT "VideoEvaluationFrame_index_check" CHECK ("index" BETWEEN 0 AND 2),
  CONSTRAINT "VideoEvaluationFrame_size_check" CHECK (octet_length("jpeg") BETWEEN 4 AND 1048576)
);
ALTER TABLE "VideoEvaluationFrame" ADD CONSTRAINT "VideoEvaluationFrame_sampleId_fkey"
  FOREIGN KEY ("sampleId") REFERENCES "VideoEvaluationSample"("id") ON DELETE CASCADE ON UPDATE CASCADE;
