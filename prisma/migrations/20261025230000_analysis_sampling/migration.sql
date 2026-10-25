ALTER TABLE "VideoAnalysis" ADD COLUMN "samplingProfile" TEXT NOT NULL DEFAULT 'standard-v1';
ALTER TABLE "VideoAnalysis" ADD CONSTRAINT "VideoAnalysis_samplingProfile_check"
  CHECK ("samplingProfile" IN ('standard-v1', 'thorough-v1'));
