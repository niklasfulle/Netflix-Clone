/** @jest-environment node */
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { analysisModelAvailable, classifyVideoFrames } from '../model';

test('connects to an authenticated external-style vision API through a real HTTP prefix', async () => {
  const names = ['VIDEO_ANALYSIS_ENABLED', 'VIDEO_ANALYSIS_URL', 'VIDEO_ANALYSIS_MODEL', 'VIDEO_ANALYSIS_API_KEY', 'VIDEO_ANALYSIS_HEALTH_PATH', 'VIDEO_ANALYSIS_RESPONSE_FORMAT'] as const;
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const received: { path: string; authorized: boolean; body?: unknown }[] = [];
  const server = createServer((request, response) => {
    const authorized = request.headers.authorization === 'Bearer fixture-only';
    if (!authorized) { response.writeHead(401); response.end(); return; }
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      received.push({ path: request.url!, authorized, ...(body && { body: JSON.parse(body) }) });
      response.setHeader('Content-Type', 'application/json');
      if (request.url === '/inference/v1/models') response.end(JSON.stringify({ data: [{ id: 'vision-test' }] }));
      else if (request.url === '/inference/v1/chat/completions') response.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ tags: [{ name: 'Natur', nameEn: 'Nature', confidence: 0.9 }], uncertain: false }) } }] }));
      else { response.writeHead(404); response.end(); }
    });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    process.env.VIDEO_ANALYSIS_ENABLED = 'true';
    process.env.VIDEO_ANALYSIS_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/inference/v1`;
    process.env.VIDEO_ANALYSIS_MODEL = 'vision-test';
    process.env.VIDEO_ANALYSIS_API_KEY = ['fixture', 'only'].join('-');
    process.env.VIDEO_ANALYSIS_HEALTH_PATH = '/inference/v1/models';
    process.env.VIDEO_ANALYSIS_RESPONSE_FORMAT = 'json_schema';
    expect(await analysisModelAvailable()).toBe(true);
    expect(await classifyVideoFrames([Buffer.from('neutral-frame')], [])).toMatchObject({ uncertain: false, tags: [{ name: 'Natur', nameEn: 'Nature' }] });
    expect(received).toHaveLength(2);
    expect(received[1]).toMatchObject({ path: '/inference/v1/chat/completions', authorized: true, body: { model: 'vision-test', response_format: { type: 'json_schema' } } });
  } finally {
    for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; }
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
