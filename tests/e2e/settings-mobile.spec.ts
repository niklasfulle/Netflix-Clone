import { expect, test } from '@playwright/test';

import { authStatePaths, createBrowserFailureMonitor } from './support';

test.describe('mobile settings', () => {
  test('keeps account and security settings within the mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePaths.user });
    const page = await context.newPage();
    const browserFailures = createBrowserFailureMonitor(page);

    try {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto('/settings');
      await expect(page.getByRole('heading', { name: /Your account, your preferences|Dein Konto, deine Einstellungen/i }))
        .toBeVisible();
      await expect(page.getByRole('button', { name: /Sign out other devices|Andere Geräte abmelden/i }))
        .toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
      browserFailures.assertNone();
    } finally {
      await context.close();
    }
  });
});
