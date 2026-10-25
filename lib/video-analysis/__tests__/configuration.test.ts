/** @jest-environment node */
import { analysisModelConfiguration } from '../configuration';
import { currentAnalysisProfileId } from '../runtime-profile';
import { analysisModelAvailable, classifyVideoFrames } from '../model';

const keys = ['VIDEO_ANALYSIS_URL', 'VIDEO_ANALYSIS_MODEL', 'VIDEO_ANALYSIS_MODEL_ID', 'VIDEO_ANALYSIS_API_KEY', 'VIDEO_ANALYSIS_HEALTH_PATH', 'VIDEO_ANALYSIS_RESPONSE_FORMAT', 'VIDEO_ANALYSIS_TIMEOUT_MS', 'VIDEO_ANALYSIS_HEALTH_TIMEOUT_MS', 'VIDEO_ANALYSIS_ENABLED'] as const;
const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
beforeEach(() => { for (const key of keys) delete process.env[key]; process.env.VIDEO_ANALYSIS_ENABLED = 'true'; globalThis.fetch = jest.fn(); });
afterAll(() => { for (const key of keys) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]; } globalThis.fetch = originalFetch; });
test('retains local defaults and normalizes reverse-proxy and versioned API roots', () => {
  expect(analysisModelConfiguration()).toMatchObject({ baseUrl: 'http://video-model:8080', completionsUrl: 'http://video-model:8080/v1/chat/completions', healthUrl: 'http://video-model:8080/health', model: 'video-category-model', authorization: {} });
  process.env.VIDEO_ANALYSIS_URL = 'https://models.example.invalid/inference/v1/';
  process.env.VIDEO_ANALYSIS_HEALTH_PATH = '/inference/v1/models';
  expect(analysisModelConfiguration()).toMatchObject({ completionsUrl: 'https://models.example.invalid/inference/v1/chat/completions', healthUrl: 'https://models.example.invalid/inference/v1/models' });
});
test('uses the configured model and bearer authorization for inference and readiness without following redirects', async () => {
  process.env.VIDEO_ANALYSIS_URL = 'https://models.example.invalid/v1';
  process.env.VIDEO_ANALYSIS_MODEL = 'organization/vision-model';
  process.env.VIDEO_ANALYSIS_API_KEY = ['fixture', 'only'].join('-');
  process.env.VIDEO_ANALYSIS_HEALTH_PATH = '/v1/models';
  jest.mocked(fetch).mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify({ tags: [], uncertain: true }) } }] }));
  expect(await analysisModelAvailable()).toBe(true);
  await classifyVideoFrames([Buffer.from('neutral-frame')], []);
  expect(fetch).toHaveBeenNthCalledWith(1, 'https://models.example.invalid/v1/models', expect.objectContaining({ headers: { Authorization: 'Bearer fixture-only' }, redirect: 'error', cache: 'no-store' }));
  const [url, options] = jest.mocked(fetch).mock.calls[1];
  expect(url).toBe('https://models.example.invalid/v1/chat/completions');
  expect(options).toMatchObject({ headers: { Authorization: 'Bearer fixture-only' }, redirect: 'error' });
  expect(JSON.parse(options!.body as string).model).toBe('organization/vision-model');
});
test('supports JSON-object providers while validating returned data with the same schema', async () => {
  process.env.VIDEO_ANALYSIS_RESPONSE_FORMAT = 'json_object';
  jest.mocked(fetch).mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify({ tags: [], uncertain: true }) } }] }));
  await classifyVideoFrames([], []);
  expect(JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string).response_format).toEqual({ type: 'json_object' });
});
test('access errors are permanent and never expose provider response details or credentials', async () => {
  process.env.VIDEO_ANALYSIS_API_KEY = ['fixture', 'only'].join('-');
  jest.mocked(fetch).mockResolvedValue(new Response('private provider details', { status: 401 }));
  await expect(classifyVideoFrames([], [])).rejects.toMatchObject({ code: 'MODEL_ACCESS_DENIED', permanent: true, message: 'MODEL_ACCESS_DENIED' });
});
test('model and endpoint changes invalidate profiles; credentials and timeouts do not', () => {
  const baseline = currentAnalysisProfileId();
  process.env.VIDEO_ANALYSIS_API_KEY = ['fixture', 'only'].join('-');
  process.env.VIDEO_ANALYSIS_TIMEOUT_MS = '120000';
  expect(currentAnalysisProfileId()).toBe(baseline);
  process.env.VIDEO_ANALYSIS_URL = 'https://models.example.invalid/v1';
  const external = currentAnalysisProfileId(); expect(external).not.toBe(baseline);
  process.env.VIDEO_ANALYSIS_MODEL = 'different-model';
  expect(currentAnalysisProfileId()).not.toBe(external);
  expect(currentAnalysisProfileId()).not.toContain('fixture');
});
test.each([
  ['VIDEO_ANALYSIS_URL', 'not-a-url'], ['VIDEO_ANALYSIS_URL', 'file:///tmp/model'],
  ['VIDEO_ANALYSIS_URL', 'https://user:pass@models.example.invalid'], ['VIDEO_ANALYSIS_URL', 'https://models.example.invalid?key=value'],
  ['VIDEO_ANALYSIS_HEALTH_PATH', '//different.example.invalid/models'], ['VIDEO_ANALYSIS_HEALTH_PATH', '/health?key=value'],
  ['VIDEO_ANALYSIS_TIMEOUT_MS', 'Infinity'], ['VIDEO_ANALYSIS_TIMEOUT_MS', '900000'], ['VIDEO_ANALYSIS_HEALTH_TIMEOUT_MS', '0'],
  ['VIDEO_ANALYSIS_MODEL', 'invalid\nmodel'], ['VIDEO_ANALYSIS_API_KEY', 'invalid\nheader'], ['VIDEO_ANALYSIS_RESPONSE_FORMAT', 'unknown'],
])('rejects invalid configuration without echoing its value: %s', (key, value) => {
  process.env[key] = value;
  expect(() => analysisModelConfiguration()).toThrow('INVALID_MODEL_CONFIGURATION');
});
