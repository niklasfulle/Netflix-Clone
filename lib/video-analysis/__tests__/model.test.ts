/** @jest-environment node */
import { analysisModelAvailable, analysisModelUrl, classifyVideoFrames, classifyVideoFramesWithDiagnostics, translateCategoryName } from '../model';
import { aggregateCategorySuggestions } from '../contracts';

const previousUrl = process.env.VIDEO_ANALYSIS_URL;
const previousEnabled = process.env.VIDEO_ANALYSIS_ENABLED;
const originalFetch = globalThis.fetch;
it('retains separate parsed model passes even when final selection drops a known category', async () => {
  globalThis.fetch = jest.fn();
  const discovered = { tags: ['Nature', 'City', 'Sea', 'Forest', 'Mountains'].map(name => ({ name, nameEn: name, confidence: 0.9 })), uncertain: false };
  const matched = { tags: ['Known1', 'Known2', 'Known3', 'Known4', 'Known5'].map(name => ({ name, nameEn: name, confidence: 0.8 })), uncertain: false };
  jest.mocked(fetch).mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify(discovered) } }] })).mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify(matched) } }] }));
  const result = await classifyVideoFramesWithDiagnostics([], matched.tags.map(tag => tag.name));
  expect(result.diagnostics).toEqual({ schemaVersion: 1, discovered, matched, matchingVocabulary: matched.tags.map(tag => tag.name), selectionLimit: 5 });
  expect(result.tags.tags).toHaveLength(5);
  expect(result.tags.tags.find(tag => tag.name === 'Known5')).toBeUndefined();
});
beforeEach(() => { process.env.VIDEO_ANALYSIS_URL = 'http://video-model:8080'; process.env.VIDEO_ANALYSIS_ENABLED = 'true'; globalThis.fetch = jest.fn(); });
afterAll(() => { globalThis.fetch = originalFetch; if (previousUrl === undefined) delete process.env.VIDEO_ANALYSIS_URL; else process.env.VIDEO_ANALYSIS_URL = previousUrl; if (previousEnabled === undefined) delete process.env.VIDEO_ANALYSIS_ENABLED; else process.env.VIDEO_ANALYSIS_ENABLED = previousEnabled; });

it('discovers new visual categories independently of existing vocabulary and keeps them through aggregation', async () => {
  jest.mocked(fetch).mockImplementation(async (_url, options) => {
    const body = JSON.parse(options!.body as string);
    const prompt = JSON.stringify(body.messages);
    const name = prompt.includes('KnownCategory') ? 'KnownCategory' : 'Außenaufnahme';
    return Response.json({ choices: [{ message: { content: JSON.stringify({ tags: [{ name, nameEn: name, confidence: 0.9 }], uncertain: false }) } }] });
  });
  const tags = await classifyVideoFrames([Buffer.from('neutral-scene')], ['KnownCategory']);
  const suggestions = aggregateCategorySuggestions([{ atSeconds: 10, tags }], [{ id: 'known', name: 'KnownCategory' }]);
  expect(suggestions).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'Außenaufnahme', categoryId: null }),
    expect.objectContaining({ name: 'KnownCategory', categoryId: 'known' }),
  ]));
  const firstPrompt = JSON.stringify(JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string).messages);
  expect(firstPrompt).not.toContain('KnownCategory');
});

it('preserves discoveries when existing-category matching is uncertain and excludes invented matches', async () => {
  const response = (tags: Array<{ name: string; nameEn: string; confidence: number }>, uncertain = false) => Response.json({ choices: [{ message: { content: JSON.stringify({ tags, uncertain }) } }] });
  jest.mocked(fetch)
    .mockResolvedValueOnce(response([{ name: 'Außenaufnahme', nameEn: 'Außenaufnahme', confidence: 0.9 }]))
    .mockResolvedValueOnce(response([{ name: 'Unbelegter Begriff', nameEn: 'Unbelegter Begriff', confidence: 0.95 }]));
  expect(await classifyVideoFrames([], ['Known'])).toEqual({ tags: [{ name: 'Außenaufnahme', nameEn: 'Außenaufnahme', confidence: 0.9 }], uncertain: false });
  jest.mocked(fetch)
    .mockResolvedValueOnce(response([{ name: 'Außenaufnahme', nameEn: 'Außenaufnahme', confidence: 0.9 }]))
    .mockResolvedValueOnce(response([], true));
  expect((await classifyVideoFrames([], ['Known'])).tags[0].name).toBe('Außenaufnahme');
});

it('keeps new discoveries ahead of existing matches within the five-label limit', async () => {
  const tags = ['One', 'Two', 'Three', 'Four', 'Five'].map(name => ({ name, nameEn: name, confidence: 0.99 }));
  jest.mocked(fetch)
    .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify({ tags: [{ name: 'Außenaufnahme', nameEn: 'Außenaufnahme', confidence: 0.7 }], uncertain: false }) } }] }))
    .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify({ tags, uncertain: false }) } }] }));
  const result = await classifyVideoFrames([], tags.map(tag => tag.name));
  expect(result.tags).toHaveLength(5);
  expect(result.tags[0].name).toBe('Außenaufnahme');
});

it('does not reuse the old matching step when discovery fails and skips matching without vocabulary', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(new Response('unavailable', { status: 503 }));
  await expect(classifyVideoFrames([], ['Known'])).rejects.toHaveProperty('code', 'MODEL_UNAVAILABLE');
  expect(fetch).toHaveBeenCalledTimes(1);
  jest.mocked(fetch).mockClear().mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify({ tags: [], uncertain: true }) } }] }));
  expect(await classifyVideoFrames([], [])).toEqual({ tags: [], uncertain: true });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('uses only the configured endpoint and bounded inline images', async () => {
  jest.mocked(fetch).mockImplementation(async () => Response.json({ choices: [{ message: { content: JSON.stringify({ tags: [{ name: 'Testbild', nameEn: 'Testbild', confidence: 0.9 }], uncertain: false }) } }] }));
  expect(await classifyVideoFrames([Buffer.from('image')], ['Known'])).toEqual({ tags: [{ name: 'Testbild', nameEn: 'Testbild', confidence: 0.9 }], uncertain: false });
  const [url, options] = jest.mocked(fetch).mock.calls[0];
  expect(url).toBe('http://video-model:8080/v1/chat/completions');
  const body = JSON.parse(options!.body as string);
  expect(body.max_tokens).toBe(768);
  expect(body.messages[1].content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
  expect(body.response_format.type).toBe('json_schema');
});

it.each(['file:///tmp/model', 'http://name:password@video-model:8080', 'http://video-model:8080/?token=value', 'http://video-model:8080/#fragment'])('rejects invalid model configuration: %s', url => {
  process.env.VIDEO_ANALYSIS_URL = url;
  expect(() => analysisModelUrl()).toThrow();
});

it.each([{}, { choices: [{ message: { content: 'not JSON' } }] }, { choices: [{ message: { content: JSON.stringify({ tags: [{ name: 'x', nameEn: 'x', confidence: 5 }], uncertain: false }) } }] }])('rejects unusable model output without exposing raw responses', async output => {
  jest.mocked(fetch).mockResolvedValue(Response.json(output));
  await expect(classifyVideoFrames([], [])).rejects.toHaveProperty('code', 'MODEL_RESPONSE_INVALID');
});

it('bounds the model response size and handles server outages', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(new Response('x'.repeat(65537))).mockResolvedValueOnce(new Response('private server details', { status: 503 }));
  await expect(classifyVideoFrames([], [])).rejects.toHaveProperty('code', 'MODEL_RESPONSE_INVALID');
  await expect(classifyVideoFrames([], [])).rejects.toHaveProperty('code', 'MODEL_UNAVAILABLE');
});

it('reports unavailable models and skips network requests when disabled', async () => {
  jest.mocked(fetch).mockRejectedValue(new Error('offline'));
  expect(await analysisModelAvailable()).toBe(false);
  jest.mocked(fetch).mockClear();
  process.env.VIDEO_ANALYSIS_ENABLED = 'false';
  expect(await analysisModelAvailable()).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});

it('requires an English translation in newly generated suggestions', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify({ tags: [{ name: 'Außenaufnahme', confidence: 0.9 }], uncertain: false }) } }] }));
  await expect(classifyVideoFrames([], [])).rejects.toHaveProperty('code', 'MODEL_RESPONSE_INVALID');
});

it('translates existing metadata into equivalent German and English names without images', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(Response.json({ choices: [{ message: { content: JSON.stringify({ tags: [{ name: 'Außenaufnahme', nameEn: 'Outdoor scene', confidence: 1 }], uncertain: false }) } }] }));
  expect(await translateCategoryName('Outdoor scene')).toEqual({ name: 'Außenaufnahme', nameEn: 'Outdoor scene' });
  const body = JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(body.messages[1].content).toHaveLength(1);
  const aggregated = aggregateCategorySuggestions([{ atSeconds: 12, tags: { tags: [{ name: 'Außenaufnahme', nameEn: 'Outdoor scene', confidence: 0.9 }], uncertain: false } }], []);
  expect(aggregated[0]).toMatchObject({ name: 'Außenaufnahme', nameEn: 'Outdoor scene', categoryId: null });
});

it('does not let five discoveries displace a supported existing category', async () => {
  const newTags = ['A', 'B', 'C', 'D', 'E'].map(name => ({ name, nameEn: name, confidence: 0.95 }));
  const response = (tags: typeof newTags) => Response.json({ choices: [{ message: { content: JSON.stringify({ tags, uncertain: false }) } }] });
  jest.mocked(fetch).mockResolvedValueOnce(response(newTags)).mockResolvedValueOnce(response([{ name: 'Known', nameEn: 'Known', confidence: 0.9 }]));
  const result = await classifyVideoFrames([], ['Known']);
  expect(result.tags).toHaveLength(5);
  expect(result.tags.filter(tag => tag.name === 'Known')).toHaveLength(1);
  expect(result.tags.filter(tag => tag.name !== 'Known')).toHaveLength(4);
});
