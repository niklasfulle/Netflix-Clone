import { createHash } from 'node:crypto';
import { VIDEO_ANALYSIS_MODEL } from './contracts';
import { classificationInstructions } from './profile';

export function currentAnalysisProfileId() {
  const fingerprint = createHash('sha256').update(classificationInstructions()).digest('hex');
  return `${VIDEO_ANALYSIS_MODEL}-${fingerprint}`;
}
