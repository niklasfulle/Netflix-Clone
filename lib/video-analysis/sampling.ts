import { z } from 'zod';

// Existing IDs describe immutable temporal grids. Add a new ID when changing
// their parameters so resumed jobs never combine different sample positions.
export const SAMPLING_PROFILES = {
  STANDARD: { id: 'standard-v1', intervalSeconds: 20, minSamples: 6, maxSamples: 120 },
  THOROUGH: { id: 'thorough-v1', intervalSeconds: 5, minSamples: 12, maxSamples: 720 },
} as const;
export const samplingModeSchema = z.enum(['STANDARD', 'THOROUGH']);
export const samplingProfileSchema = z.enum(['standard-v1', 'thorough-v1']);
export type SamplingMode = z.infer<typeof samplingModeSchema>;
export type SamplingProfileId = z.infer<typeof samplingProfileSchema>;
export const MAX_ANALYSIS_SAMPLES = 720;
