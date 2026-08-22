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
      await expect(page.getByRole('button', { name: /Scan QR code|QR-Code scannen/i }))
        .toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 160));
      await expect(page.locator('nav > div').first()).toHaveClass(/bg-zinc-900/);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
      const clippedSettingsElements = await page.locator(
        'main aside, main form, main section, main input, main button',
      ).evaluateAll((elements) => elements.flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.left >= -1 && rect.right <= window.innerWidth + 1) return [];
        return [{
          element: element.tagName.toLowerCase(),
          id: element.id,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        }];
      }));
      expect(clippedSettingsElements).toEqual([]);
      browserFailures.assertNone();
    } finally {
      await context.close();
    }
  });
});
