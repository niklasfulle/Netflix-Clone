import { expect, test, type Page, type Route } from '@playwright/test';

import { authStatePaths } from './support';

const verificationEndpoint = '**/api/admin/backups/verification';
const retentionEndpoint = '**/api/admin/backups/retention';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockBackupEvidence(page: Page) {
  await page.route(verificationEndpoint, route => json(route, {
    status: null,
    scheduled: null,
  }));
}

test.describe('administrator background-job lifecycle', () => {
  test.use({ storageState: authStatePaths.admin });

  test('shows queued retention progress and its durable completion', async ({ page }) => {
    await mockBackupEvidence(page);
    await page.route(retentionEndpoint, route => json(route, {
      jobRunId: 'retention-job-e2e-complete',
      queueJobId: 'retention-queue-e2e-complete',
      status: 'QUEUED',
      duplicate: false,
      correlationId: 'retention-correlation-complete',
    }, 202));
    let statusReads = 0;
    await page.route('**/api/admin/jobs/retention-job-e2e-complete', (route) => {
      statusReads += 1;
      return json(route, statusReads === 1 ? {
        id: 'retention-job-e2e-complete',
        status: 'RUNNING',
        progress: 40,
        progressMessage: 'Removing expired backups',
        errorMessage: null,
      } : {
        id: 'retention-job-e2e-complete',
        status: 'SUCCEEDED',
        progress: 100,
        progressMessage: 'Completed',
        errorMessage: null,
      });
    });

    await page.goto('/admin/backups');
    await page.getByRole('button', { name: 'Run Backup Retention Cleanup' }).click();

    await expect(page.getByRole('status')).toContainText('Removing expired backups · 40%');
    await page.reload();
    await expect(page.getByRole('status')).toContainText('Retention cleanup completed.');
  });

  test('allows an administrator to cancel an active retention job', async ({ page }) => {
    await mockBackupEvidence(page);
    await page.route(retentionEndpoint, route => json(route, {
      jobRunId: 'retention-job-e2e-cancel',
      queueJobId: 'retention-queue-e2e-cancel',
      status: 'QUEUED',
      duplicate: false,
      correlationId: 'retention-correlation-cancel',
    }, 202));
    await page.route('**/api/admin/jobs/retention-job-e2e-cancel', (route) => {
      if (route.request().method() === 'DELETE') {
        return json(route, {
          id: 'retention-job-e2e-cancel',
          status: 'CANCELLED',
          progress: 20,
          progressMessage: 'Cancelled',
          errorMessage: null,
        });
      }
      return json(route, {
        id: 'retention-job-e2e-cancel',
        status: 'RUNNING',
        progress: 20,
        progressMessage: 'Evaluating retention policy',
        errorMessage: null,
      });
    });

    await page.goto('/admin/backups');
    await page.getByRole('button', { name: 'Run Backup Retention Cleanup' }).click();
    await expect(page.getByRole('button', { name: 'Cancel retention cleanup' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel retention cleanup' }).click();

    await expect(page.getByRole('status')).toContainText('Retention cleanup cancelled.');
  });

  test('reports a worker outage and permits a successful retry', async ({ page }) => {
    await mockBackupEvidence(page);
    let submissions = 0;
    await page.route(retentionEndpoint, (route) => {
      submissions += 1;
      if (submissions === 1) {
        return json(route, { error: 'Background worker is unavailable.' }, 503);
      }
      return json(route, {
        jobRunId: 'retention-job-e2e-retry',
        queueJobId: 'retention-queue-e2e-retry',
        status: 'QUEUED',
        duplicate: false,
        correlationId: 'retention-correlation-retry',
      }, 202);
    });
    await page.route('**/api/admin/jobs/retention-job-e2e-retry', route => json(route, {
      id: 'retention-job-e2e-retry',
      status: 'SUCCEEDED',
      progress: 100,
      progressMessage: 'Completed',
      errorMessage: null,
    }));

    await page.goto('/admin/backups');
    const runButton = page.getByRole('button', { name: 'Run Backup Retention Cleanup' });
    await runButton.click();
    await expect(page.getByRole('alert')).toContainText('Background worker is unavailable.');

    await runButton.click();
    await expect(page.getByRole('status')).toContainText('Retention cleanup completed.');
  });
});
