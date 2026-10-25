import { createHash } from 'node:crypto';
import { VIDEO_ANALYSIS_MODEL } from './contracts';
import { classificationInstructions } from './profile';

export function currentAnalysisProfileId() {
  const model = process.env.VIDEO_ANALYSIS_MODEL_ID || VIDEO_ANALYSIS_MODEL;
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(model)) throw new Error('INVALID_MODEL_PROFILE');
  const fingerprint = createHash('sha256').update(classificationInstructions()).digest('hex');
  return `${model}-${fingerprint}`;
}
