CREATE TABLE "VideoEvaluation" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "jobRunId" TEXT,
  "model" TEXT NOT NULL,
  "vocabulary" JSONB NOT NULL,
  "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "VideoEvaluation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VideoEvaluation_requestId_key" ON "VideoEvaluation"("requestId");
CREATE UNIQUE INDEX "VideoEvaluation_jobRunId_key" ON "VideoEvaluation"("jobRunId");
CREATE INDEX "VideoEvaluation_createdAt_idx" ON "VideoEvaluation"("createdAt");
ALTER TABLE "VideoEvaluation" ADD CONSTRAINT "VideoEvaluation_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "VideoEvaluationSample" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "exampleId" TEXT NOT NULL,
  "exampleVersion" INTEGER NOT NULL,
  "movieId" TEXT NOT NULL,
  "sourceFingerprint" TEXT NOT NULL,
  "startSeconds" DOUBLE PRECISION NOT NULL,
  "endSeconds" DOUBLE PRECISION NOT NULL,
  "labels" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "tags" JSONB,
  CONSTRAINT "VideoEvaluationSample_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VideoEvaluationSample_evaluationId_exampleId_key" ON "VideoEvaluationSample"("evaluationId", "exampleId");
ALTER TABLE "VideoEvaluationSample" ADD CONSTRAINT "VideoEvaluationSample_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "VideoEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
