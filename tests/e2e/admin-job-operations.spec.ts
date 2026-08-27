import { expect, test, type Page, type Route } from '@playwright/test';

import { authStatePaths } from './support';

const statuses = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCEL_REQUESTED',
  'CANCELLED',
  'DEAD_LETTER',
] as const;

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function job(status: typeof statuses[number], index: number) {
  return {
    id: `job-run-operation-${index}`,
    jobType: index % 2 === 0 ? 'media.integrity.scan' : 'backup.verification.request',
    status,
    progress: status === 'SUCCEEDED' ? 100 : 40,
    progressMessage: `${status} operation`,
    attemptCount: status === 'FAILED' || status === 'DEAD_LETTER' ? 3 : 1,
    actor: { userId: 'admin-user-e2e', role: 'ADMIN' },
    target: { type: 'catalog', id: 'published' },
    correlationId: `job-correlation-${index}`,
    failure: status === 'FAILED' || status === 'DEAD_LETTER'
      ? { code: 'OperationFailed', message: 'Background operation failed.' }
      : null,
    acceptedAt: '2026-08-25T09:00:00.000Z',
    startedAt: '2026-08-25T09:00:05.000Z',
    completedAt: status === 'SUCCEEDED' ? '2026-08-25T09:01:00.000Z' : null,
    cancelRequestedAt: status === 'CANCEL_REQUESTED' ? '2026-08-25T09:00:30.000Z' : null,
    updatedAt: '2026-08-25T09:01:00.000Z',
  };
}

function dashboardResponse() {
  return {
    items: statuses.map(job),
    nextCursor: null,
    health: {
      worker: {
        status: 'healthy',
        state: 'ACTIVE',
        startedAt: '2026-08-25T08:00:00.000Z',
        heartbeatAt: '2026-08-25T09:01:00.000Z',
        stoppedAt: null,
        heartbeatAgeMs: 2_000,
      },
      queue: { depth: 2, oldestQueuedAt: '2026-08-25T09:00:00.000Z', oldestQueuedAgeMs: 60_000 },
      counts: { QUEUED: 1, RUNNING: 1, SUCCEEDED: 1, FAILED: 1, CANCEL_REQUESTED: 1, CANCELLED: 1, DEAD_LETTER: 1 },
      observedAt: '2026-08-25T09:01:02.000Z',
    },
  };
}

async function mockDashboard(page: Page) {
  await page.route('**/api/admin/jobs?**', route => json(route, dashboardResponse()));
}

test.describe('administrator job operations dashboard', () => {
  test.use({ storageState: authStatePaths.admin });

  test('shows every lifecycle state and supports keyboard retry and cancellation', async ({ page }) => {
    await mockDashboard(page);
    let retried = false;
    let cancelled = false;
    await page.route('**/api/admin/jobs/job-run-operation-*', (route) => {
      const method = route.request().method();
      if (method === 'POST') retried = true;
      if (method === 'DELETE') cancelled = true;
      return json(route, { id: route.request().url().split('/').at(-1), status: 'QUEUED', duplicate: false }, 202);
    });

    await page.goto('/admin/jobs');
    await expect(page.getByRole('heading', { name: 'Job Operations' })).toBeVisible();
    await expect(page.getByText('Worker healthy')).toBeVisible();
    for (const status of statuses) {
      await expect(page.locator('main article').getByText(
        status.replaceAll('_', ' '),
        { exact: true },
      ).first()).toBeVisible();
    }

    const retry = page.getByRole('button', { name: 'Retry job job-run-operation-3' });
    await retry.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => retried).toBe(true);

    const cancel = page.getByRole('button', { name: 'Cancel job job-run-operation-0' });
    await cancel.focus();
    await page.keyboard.press('Space');
    await expect.poll(() => cancelled).toBe(true);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= globalThis.innerWidth)).toBe(true);
  });

  test('shows permission denial as unavailable and never as healthy', async ({ page }) => {
    await page.route('**/api/admin/jobs?**', route => json(route, { error: 'Forbidden' }, 403));

    await page.goto('/admin/jobs');

    await expect(page.locator('main').getByRole('alert')).toContainText('Forbidden');
    await expect(page.getByText('Worker healthy')).toHaveCount(0);
  });
});
