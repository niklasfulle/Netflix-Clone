import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

import {
  authStatePaths,
  createBrowserFailureMonitor,
  selectFirstProfile,
} from './support';

test.use({ storageState: authStatePaths.user });

interface CatalogCandidate {
  id: string;
  title: string;
}

interface CatalogMovie extends CatalogCandidate {
  type: string;
  videoUrl: string;
}

interface PlayableCatalogFixture {
  movie: CatalogMovie;
  cleanup: () => Promise<void>;
}

const MINIMAL_MP4 = [
  0, 0, 0, 24, 102, 116, 121, 112,
  105, 115, 111, 109, 0, 0, 2, 0,
  105, 115, 111, 109, 105, 115, 111, 50,
];
const STAGING_PLAYER_MOVIE_ID = 'staging-player-movie';

async function createAdminContext(browser: Browser, baseURL: string) {
  return browser.newContext({
    baseURL,
    storageState: authStatePaths.admin,
  });
}

async function findPlayableCatalogItem(
  request: APIRequestContext,
  browser: Browser,
  baseURL: string,
  projectName: string,
): Promise<PlayableCatalogFixture> {
  const response = await request.get('/api/movies/new');
  expect(response.ok()).toBe(true);
  const candidates = await response.json() as CatalogCandidate[];

  const stagingCandidate = candidates.find(({ id }) => id === STAGING_PLAYER_MOVIE_ID);
  const orderedCandidates = stagingCandidate
    ? [stagingCandidate, ...candidates.filter(({ id }) => id !== STAGING_PLAYER_MOVIE_ID)]
    : candidates;

  for (const candidate of orderedCandidates) {
    if (!candidate.id || !candidate.title || candidate.title.includes('/')) continue;
    const availability = await request.head(`/api/video/billboard/${candidate.id}`);
    if (availability.headers()['x-video-available'] === 'true') {
      const detailResponse = await request.get(`/api/movies/${candidate.id}`);
      expect(detailResponse.ok()).toBe(true);
      return {
        movie: await detailResponse.json() as CatalogMovie,
        cleanup: async () => undefined,
      };
    }
  }

  const detailedCandidates = await Promise.all(candidates.map(async (candidate) => {
    const detailResponse = await request.get(`/api/movies/${candidate.id}`);
    if (!detailResponse.ok()) return null;
    return await detailResponse.json() as CatalogMovie;
  }));
  const safeCandidates = detailedCandidates.filter((candidate): candidate is CatalogMovie => Boolean(
    candidate
    && typeof candidate.videoUrl === 'string'
    && candidate.id
    && candidate.title
    && !candidate.title.includes('/')
    && /^[a-zA-Z0-9_-]+$/.test(candidate.videoUrl)
  ));
  const candidateIndex = projectName === 'mobile' ? 1 : 0;
  const candidate = safeCandidates[candidateIndex] ?? safeCandidates[0];
  if (!candidate) {
    throw new Error('No safe movie exists for the temporary E2E video fixture.');
  }

  const adminContext = await createAdminContext(browser, baseURL);
  const adminPage = await adminContext.newPage();
  let uploadedFilePath: string | undefined;
  const deleteUploadedFile = async () => {
    if (!uploadedFilePath) return;
    const deleteResult = await adminPage.evaluate(async (filePath) => {
      const response = await fetch('/api/movies/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      return { ok: response.ok, status: response.status };
    }, uploadedFilePath);
    expect(deleteResult.ok, `video cleanup failed with ${deleteResult.status}`).toBe(true);
  };
  try {
    await adminPage.goto('/api/health');
    const uploadId = `e2e-${projectName}-${Date.now()}`;
    const uploadResult = await adminPage.evaluate(async ({
      bytes,
      fileName,
      fileId,
      generatedId,
      videoType,
    }) => {
      const formData = new FormData();
      formData.set('chunk', new Blob([new Uint8Array(bytes)], { type: 'video/mp4' }), fileName);
      formData.set('chunkIndex', '0');
      formData.set('totalChunks', '1');
      formData.set('fileName', fileName);
      formData.set('fileId', fileId);
      formData.set('videoType', videoType);
      formData.set('generatedId', generatedId);
      const response = await fetch('/api/movies/upload-chunk', {
        method: 'POST',
        body: formData,
      });
      return {
        ok: response.ok,
        status: response.status,
        payload: await response.json() as { filePath?: string },
      };
    }, {
      bytes: MINIMAL_MP4,
      fileName: `${candidate.videoUrl}.mp4`,
      fileId: uploadId,
      generatedId: candidate.videoUrl,
      videoType: candidate.type === 'Serie' ? 'Serie' : 'Movie',
    });
    if (uploadResult.status === 409) {
      return {
        movie: candidate,
        cleanup: async () => adminContext.close(),
      };
    }
    expect(uploadResult.ok).toBe(true);
    uploadedFilePath = uploadResult.payload.filePath;
    expect(uploadedFilePath).toBeTruthy();

    const availability = await request.head(`/api/video/billboard/${candidate.id}`);
    expect(availability.headers()['x-video-available']).toBe('true');
    return {
      movie: candidate,
      cleanup: async () => {
        await deleteUploadedFile();
        await adminContext.close();
      },
    };
  } catch (error) {
    await deleteUploadedFile();
    await adminContext.close();
    throw error;
  }
}

async function openCatalogLink(page: Page, href: string) {
  const links = page.locator(`a[href="${href}"]`);
  const findVisibleLink = async () => {
    for (let index = 0; index < await links.count(); index += 1) {
      const link = links.nth(index);
      if (await link.isVisible()) return link;
    }
    return null;
  };

  let visibleLink = await findVisibleLink();
  if (!visibleLink) {
    await page.getByRole('button', { name: /Browse|Durchsuchen/i }).click();
    visibleLink = page.locator(`#mobile-catalog-menu a[href="${href}"]`);
  }
  await expect(visibleLink, `No visible catalog link matched ${href}`).toBeVisible();
  return visibleLink!;
}

async function openPlayerFromDetails(page: Page, movieId: string) {
  const expectedUrl = new RegExp(`/watch/${movieId}`);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const playLink = page.getByRole('dialog').getByRole('link', { name: /Play content/i });
    await expect(playLink).toHaveAttribute('href', expectedUrl);
    await playLink.click();

    try {
      await page.waitForURL(expectedUrl, { timeout: 8_000 });
      return;
    } catch (error) {
      if (attempt === 1) throw error;
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  }
}

test('user can search, inspect, favorite, play, and find content in the watchlist', async ({
  browser,
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const browserFailures = createBrowserFailureMonitor(page);
  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== 'string') throw new Error('Playwright baseURL is required.');
  const fixture = await findPlayableCatalogItem(
    page.request,
    browser,
    baseURL,
    testInfo.project.name,
  );
  const { movie } = fixture;

  try {
    const rangeResponse = await page.request.get(`/api/video/${movie.id}`, {
      headers: { Range: 'bytes=0-15' },
    });
    expect(rangeResponse.status()).toBe(206);
    expect(rangeResponse.headers()['accept-ranges']).toBe('bytes');
    expect(rangeResponse.headers()['content-range']).toMatch(/^bytes 0-15\/\d+$/);
    expect((await rangeResponse.body()).byteLength).toBe(16);

    await selectFirstProfile(page);
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: /Search|Suchen/i });
    await search.fill(movie.title);
    await Promise.all([
      page.waitForURL((url) => (
        decodeURIComponent(url.pathname) === `/search/${movie.title}`
      ), { timeout: 30_000 }),
      search.press('Enter'),
    ]);

  await page.getByRole('button', {
    name: `Show details for ${movie.title}`,
    exact: true,
  }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(movie.title);

  const addFavorite = dialog.getByRole('button', { name: /Add to favorites/i });
  if (await addFavorite.isVisible()) {
    await addFavorite.click();
    await expect(dialog.getByRole('button', { name: /Remove from favorites/i })).toBeVisible();
    await dialog.getByRole('button', { name: /Remove from favorites/i }).click();
    await expect(dialog.getByRole('button', { name: /Add to favorites/i })).toBeVisible();
  }

    await openPlayerFromDetails(page, movie.id);
    const video = page.locator('video');
    await expect(video).toBeVisible();
    if (movie.id === STAGING_PLAYER_MOVIE_ID) {
      await expect.poll(() => video.evaluate((element) => {
        const media = element as HTMLVideoElement;
        return Number.isFinite(media.duration)
          && media.duration >= 9
          && media.readyState >= 1;
      })).toBe(true);
    }

  await page.goBack();
  await expect(page).toHaveURL((url) => (
    decodeURIComponent(url.pathname) === `/search/${movie.title}`
  ));
  const closeButton = page.getByRole('button', { name: /Close details$/i });
  if (await closeButton.isVisible()) await closeButton.click();

  const watchlistLink = await openCatalogLink(page, '/watchlist');
  await watchlistLink.click();
  await expect(page).toHaveURL(/\/watchlist$/);
  await expect(page.getByRole('button', {
    name: `Show details for ${movie.title}`,
    exact: true,
  }).first()).toBeVisible();

    browserFailures.assertNone();
  } finally {
    await fixture.cleanup();
  }
});
