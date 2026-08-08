import { expect, test } from '@playwright/test';

import { authStatePaths } from './support';

const INITIAL_CATALOG_JSON_BUDGET_BYTES = 250_000;

test.use({ storageState: authStatePaths.user });

test('keeps the initial movie catalog JSON within its mobile budget', async ({
  context,
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 1_600_000 / 8,
    uploadThroughput: 750_000 / 8,
    connectionType: 'cellular4g',
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    const metrics = { cls: 0, lcp: 0 };
    Object.defineProperty(window, '__catalogMetrics', { value: metrics });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) metrics.lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) metrics.cls += shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const catalogResponses: Array<Promise<{ body: Buffer; url: string }>> = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    const isCatalogJson = url.pathname === '/api/movies/newMovies'
      || url.pathname.includes('/api/movies/moviesByActor/');
    if (!isCatalogJson || response.status() !== 200) return;
    catalogResponses.push(response.body().then((body) => ({ body, url: url.pathname })));
  });

  const newMoviesResponse = page.waitForResponse((response) => (
    new URL(response.url()).pathname === '/api/movies/newMovies' && response.status() === 200
  ));
  const actorsResponse = page.waitForResponse((response) => (
    new URL(response.url()).pathname === '/api/movies/getActors/0_3' && response.status() === 200
  ));
  await page.goto('/movies');
  await expect(page.getByText('New', { exact: true })).toBeVisible({ timeout: 30_000 });
  const [, actorListResponse] = await Promise.all([newMoviesResponse, actorsResponse]);
  const actors = await actorListResponse.json() as string[];
  if (actors.length > 0) {
    await expect.poll(() => catalogResponses.length, { timeout: 30_000 }).toBeGreaterThan(1);
  }
  await expect.poll(() => page.evaluate(() => (
    window as unknown as { __catalogMetrics: { lcp: number } }
  ).__catalogMetrics.lcp), { timeout: 30_000 }).toBeGreaterThan(0);

  const payloads = await Promise.all(catalogResponses);
  expect(payloads.some(({ url }) => url === '/api/movies/newMovies')).toBe(true);

  const totalBytes = payloads.reduce((sum, { body }) => sum + body.byteLength, 0);
  const combinedJson = payloads.map(({ body }) => body.toString('utf8')).join('\n');
  console.info(`Initial catalog JSON: ${totalBytes} bytes across ${payloads.length} responses`);
  const metrics = await page.evaluate(() => (
    window as unknown as { __catalogMetrics: { cls: number; lcp: number } }
  ).__catalogMetrics);
  console.info(`Mobile trace: LCP ${Math.round(metrics.lcp)} ms, CLS ${metrics.cls.toFixed(3)}`);
  expect(totalBytes).toBeLessThanOrEqual(INITIAL_CATALOG_JSON_BUDGET_BYTES);
  expect(combinedJson).not.toContain('"videoUrl"');
  expect(combinedJson).not.toContain('data:image');
});
