/** @jest-environment node */
import { analysisModelAvailable, analysisModelUrl, classifyVideoFrames, classifyVideoFramesWithDiagnostics, translateCategoryName } from '../model';
import { aggregateCategorySuggestions } from '../contracts';

const previousUrl = process.env.VIDEO_ANALYSIS_URL;
const previousEnabled = process.env.VIDEO_ANALYSIS_ENABLED;
const originalFetch = globalThis.fetch;
const response = (tags: Array<{ name: string; nameEn?: string; confidence: number }>, uncertain = false) => Response.json({ choices: [{ message: { content: JSON.stringify({ tags, uncertain }) } }] });
beforeEach(() => { process.env.VIDEO_ANALYSIS_URL = 'http://video-model:8080'; process.env.VIDEO_ANALYSIS_ENABLED = 'true'; globalThis.fetch = jest.fn(); });
afterAll(() => { globalThis.fetch = originalFetch; if (previousUrl === undefined) delete process.env.VIDEO_ANALYSIS_URL; else process.env.VIDEO_ANALYSIS_URL = previousUrl; if (previousEnabled === undefined) delete process.env.VIDEO_ANALYSIS_ENABLED; else process.env.VIDEO_ANALYSIS_ENABLED = previousEnabled; });

it('matches existing names in one pass, rejects invented categories and preserves canonical translations', async () => {
  jest.mocked(fetch).mockResolvedValue(response([{ name: 'Natur', nameEn: 'Invented translation', confidence: 0.9 }, { name: 'New category', nameEn: 'New category', confidence: 0.99 }]));
  const result = await classifyVideoFramesWithDiagnostics([Buffer.from('neutral-scene')], [{ name: 'Natur', nameEn: 'Nature' }]);
  expect(result.tags).toEqual({ tags: [{ name: 'Natur', nameEn: 'Nature', confidence: 0.9 }], uncertain: false });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.diagnostics).toMatchObject({ schemaVersion: 2, matchingVocabulary: ['Natur'], selectionLimit: 5 });
  const body = JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(body.messages[1].content[0].text).toContain('ONLY these existing categories');
  expect(body.response_format.json_schema.schema.properties.tags.items.properties.name.enum).toEqual(['Natur']);
  expect(body.response_format.json_schema.schema.properties.tags.items.properties.nameEn.enum).toEqual(['Nature']);
});
it('never requests discovery or inference without an existing vocabulary', async () => {
  expect(await classifyVideoFrames([], [])).toEqual({ tags: [], uncertain: true });
  expect(fetch).not.toHaveBeenCalled();
});
it('never accepts a suggestion from an uncertain model response', async () => {
  jest.mocked(fetch).mockResolvedValue(response([{ name: 'Natur', nameEn: 'Nature', confidence: 0.99 }], true));
  expect(await classifyVideoFrames([], ['Natur'])).toEqual({ tags: [], uncertain: true });
});
it('checks categories beyond the old 64-name boundary in bounded passes', async () => {
  const vocabulary = Array.from({ length: 70 }, (_, index) => 'Category' + index);
  jest.mocked(fetch).mockResolvedValueOnce(response([])).mockResolvedValueOnce(response([])).mockResolvedValueOnce(response([{ name: 'Category69', nameEn: 'Category69', confidence: 0.9 }]));
  const result = await classifyVideoFramesWithDiagnostics([], vocabulary);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(result.tags.tags).toEqual([{ name: 'Category69', nameEn: 'Category69', confidence: 0.9 }]);
  expect(result.diagnostics.matchingVocabulary).toHaveLength(70);
});
it('does not make oversized or duplicate catalog requests', async () => {
  jest.mocked(fetch).mockResolvedValue(response([]));
  await classifyVideoFrames([], ['Natur', ' natur ']);
  expect(fetch).toHaveBeenCalledTimes(1);
  await expect(classifyVideoFrames([], Array.from({ length: 1025 }, (_, index) => 'Category' + index))).rejects.toHaveProperty('code', 'TOO_MANY_ANALYSIS_CATEGORIES');
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('filters invented names during aggregation even if a caller bypasses the model filter', () => {
  const tags = { tags: [{ name: 'Unknown', nameEn: 'Unknown', confidence: 1 }, { name: 'Natur', nameEn: 'Wrong', confidence: 0.9 }], uncertain: false };
  expect(aggregateCategorySuggestions([{ atSeconds: 1, tags }], [{ id: 'nature', name: 'Natur', nameEn: 'Nature' }])).toEqual([expect.objectContaining({ categoryId: 'nature', name: 'Natur', nameEn: 'Nature' })]);
  expect(aggregateCategorySuggestions([{ atSeconds: 1, tags }], [])).toEqual([]);
});
it('uses only the configured endpoint and bounded inline images', async () => {
  jest.mocked(fetch).mockResolvedValue(response([{ name: 'Natur', nameEn: 'Nature', confidence: 0.9 }]));
  await classifyVideoFrames([Buffer.from('image')], [{ name: 'Natur', nameEn: 'Nature' }]);
  const [url, options] = jest.mocked(fetch).mock.calls[0];
  expect(url).toBe('http://video-model:8080/v1/chat/completions');
  const body = JSON.parse(options!.body as string);
  expect(body.max_tokens).toBe(768);
  expect(body.messages[1].content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
});
it.each(['file:///tmp/model', 'http://name:password@video-model:8080', 'http://video-model:8080/?token=value', 'http://video-model:8080/#fragment'])('rejects invalid model configuration: %s', url => {
  process.env.VIDEO_ANALYSIS_URL = url; expect(() => analysisModelUrl()).toThrow();
});
it.each([{}, { choices: [{ message: { content: 'not JSON' } }] }, { choices: [{ message: { content: JSON.stringify({ tags: [{ name: 'x', nameEn: 'x', confidence: 5 }], uncertain: false }) } }] }])('rejects unusable model output without exposing raw responses', async output => {
  jest.mocked(fetch).mockResolvedValue(Response.json(output));
  await expect(classifyVideoFrames([], ['Natur'])).rejects.toHaveProperty('code', 'MODEL_RESPONSE_INVALID');
});
it('bounds response size, handles outages and does not retry in a discovery mode', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(new Response('x'.repeat(65537))).mockResolvedValueOnce(new Response('private server details', { status: 503 }));
  await expect(classifyVideoFrames([], ['Natur'])).rejects.toHaveProperty('code', 'MODEL_RESPONSE_INVALID');
  await expect(classifyVideoFrames([], ['Natur'])).rejects.toHaveProperty('code', 'MODEL_UNAVAILABLE');
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('reports unavailable models and skips readiness requests when disabled', async () => {
  jest.mocked(fetch).mockRejectedValue(new Error('offline')); expect(await analysisModelAvailable()).toBe(false);
  jest.mocked(fetch).mockClear(); process.env.VIDEO_ANALYSIS_ENABLED = 'false';
  expect(await analysisModelAvailable()).toBe(false); expect(fetch).not.toHaveBeenCalled();
});
it('retains explicit metadata translation separately from video classification', async () => {
  jest.mocked(fetch).mockResolvedValue(response([{ name: 'Außenaufnahme', nameEn: 'Outdoor scene', confidence: 1 }]));
  expect(await translateCategoryName('Outdoor scene')).toEqual({ name: 'Außenaufnahme', nameEn: 'Outdoor scene' });
  const body = JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(body.messages[1].content).toHaveLength(1);
  expect(body.response_format.json_schema.schema.properties.tags.items.properties.name.enum).toBeUndefined();
});
