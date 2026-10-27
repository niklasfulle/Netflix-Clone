-- Idempotent retirement for existing installations. Keep results, examples,
-- category assignments and completed job history; never recreate these queues.
BEGIN;

DO $$
BEGIN
  IF to_regclass('pgboss.job') IS NOT NULL THEN
    UPDATE pgboss.job
    SET state = 'cancelled', completed_on = now()
    WHERE name IN (
      'video.categories.analyze', 'video.categories.analyze.dead',
      'video.examples.evaluate', 'video.examples.evaluate.dead'
    ) AND state IN ('created', 'retry', 'active');
  END IF;
END $$;

UPDATE "JobRun"
SET "status" = 'CANCELLED', "completedAt" = now(), "updatedAt" = now(),
    "errorCode" = 'FEATURE_REMOVED', "progressMessage" = NULL
WHERE "jobType" IN ('video.categories.analyze', 'video.examples.evaluate')
  AND "status" IN ('QUEUED', 'RUNNING', 'CANCEL_REQUESTED');

UPDATE "VideoAnalysis"
SET "status" = 'CANCELLED', "completedAt" = now(), "updatedAt" = now(),
    "errorCode" = 'FEATURE_REMOVED'
WHERE "status" IN ('QUEUED', 'RUNNING', 'CANCEL_REQUESTED');

UPDATE "VideoEvaluation"
SET "status" = 'CANCELLED', "completedAt" = now(), "errorCode" = 'FEATURE_REMOVED'
WHERE "status" IN ('QUEUED', 'RUNNING', 'CANCEL_REQUESTED');

COMMIT;
