import { createHash } from 'node:crypto';
import { VIDEO_ANALYSIS_MODEL } from './contracts';
import { classificationInstructions } from './profile';
import { analysisModelConfiguration, DEFAULT_ANALYSIS_URL, DEFAULT_ANALYSIS_REQUEST_MODEL } from './configuration';

export function currentAnalysisProfileId() {
  const config = analysisModelConfiguration();
  const model = process.env.VIDEO_ANALYSIS_MODEL_ID || (config.model === DEFAULT_ANALYSIS_REQUEST_MODEL ? VIDEO_ANALYSIS_MODEL : config.model.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 128));
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(model)) throw new Error('INVALID_MODEL_PROFILE');
  const fingerprintInput = classificationInstructions() + (config.baseUrl === DEFAULT_ANALYSIS_URL && config.model === DEFAULT_ANALYSIS_REQUEST_MODEL && config.responseFormat === 'json_schema' ? '' : JSON.stringify([config.baseUrl, config.model, config.responseFormat]));
  const fingerprint = createHash('sha256').update(fingerprintInput).digest('hex');
  return `${model}-${fingerprint}`;
}
