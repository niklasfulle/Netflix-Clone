CREATE TYPE "JobRunStatus" AS ENUM (
    'QUEUED',
    'RUNNING',
    'SUCCEEDED',
    'FAILED',
    'CANCEL_REQUESTED',
    'CANCELLED',
    'DEAD_LETTER'
);

CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "contractVersion" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "queueJobId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "status" "JobRunStatus" NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "progressMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "JobRun_progress_check" CHECK ("progress" BETWEEN 0 AND 100),
    CONSTRAINT "JobRun_attemptCount_check" CHECK ("attemptCount" >= 0)
);

CREATE UNIQUE INDEX "JobRun_queueJobId_key" ON "JobRun"("queueJobId");
CREATE UNIQUE INDEX "JobRun_jobType_idempotencyKey_key" ON "JobRun"("jobType", "idempotencyKey");
CREATE INDEX "JobRun_status_acceptedAt_idx" ON "JobRun"("status", "acceptedAt");
CREATE INDEX "JobRun_actorUserId_acceptedAt_idx" ON "JobRun"("actorUserId", "acceptedAt");
CREATE INDEX "JobRun_correlationId_idx" ON "JobRun"("correlationId");
CREATE INDEX "JobRun_completedAt_idx" ON "JobRun"("completedAt");
