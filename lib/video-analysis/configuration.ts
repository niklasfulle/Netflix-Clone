import { VideoAnalysisError } from './contracts';

export const DEFAULT_ANALYSIS_URL = 'http://video-model:8080';
export const DEFAULT_ANALYSIS_REQUEST_MODEL = 'video-category-model';
function invalid(): never { throw new VideoAnalysisError('INVALID_MODEL_CONFIGURATION', true); }
function timeout(value: string | undefined, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  if (!/^\d+$/.test(value)) return invalid();
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : invalid();
}
export function analysisModelConfiguration() {
  let url: URL;
  try { url = new URL(process.env.VIDEO_ANALYSIS_URL || DEFAULT_ANALYSIS_URL); }
  catch { return invalid(); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return invalid();
  const baseUrl = url.href.replace(/\/+$/, '');
  const apiUrl = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
  const model = process.env.VIDEO_ANALYSIS_MODEL || DEFAULT_ANALYSIS_REQUEST_MODEL;
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,190}$/.test(model)) return invalid();
  const apiKey = process.env.VIDEO_ANALYSIS_API_KEY || '';
  if (apiKey.length > 8192 || Array.from(apiKey).some(character => character.charCodeAt(0) <= 32 || character.charCodeAt(0) >= 127)) return invalid();
  const authorization: Record<string, string> = {};
  if (apiKey) authorization.Authorization = `Bearer ${apiKey}`;
  const healthPath = process.env.VIDEO_ANALYSIS_HEALTH_PATH || '/health';
  if (!/^\/(?!\/)[A-Za-z0-9._~%/-]*$/.test(healthPath)) return invalid();
  const responseFormat = process.env.VIDEO_ANALYSIS_RESPONSE_FORMAT || 'json_schema';
  if (!['json_schema', 'json_object'].includes(responseFormat)) return invalid();
  return {
    baseUrl, completionsUrl: `${apiUrl}/chat/completions`, model,
    healthUrl: new URL(healthPath, url.origin).href,
    authorization,
    responseFormat,
    timeoutMs: timeout(process.env.VIDEO_ANALYSIS_TIMEOUT_MS, 90000, 1000, 300000),
    healthTimeoutMs: timeout(process.env.VIDEO_ANALYSIS_HEALTH_TIMEOUT_MS, 1500, 100, 15000),
  };
}
