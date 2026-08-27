CREATE TABLE "JobWorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "instanceToken" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "heartbeatAt" TIMESTAMP(3) NOT NULL,
    "stoppedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobWorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobWorkerHeartbeat_heartbeatAt_idx" ON "JobWorkerHeartbeat"("heartbeatAt");
