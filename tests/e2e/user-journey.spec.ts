import { expect, test } from '@playwright/test';

import {
  accounts,
  createBrowserFailureMonitor,
  login,
} from './support';

async function navigateFromCatalogMenu(
  page: import('@playwright/test').Page,
  name: RegExp,
) {
  const link = page.getByRole('link', { name, exact: true });
  if (!(await link.isVisible())) {
    await page.getByRole('button', { name: /Browse|Durchsuchen/i }).click();
  }
  await link.click();
}

test('normal user can navigate the primary catalog journey and sign out', async ({ page }) => {
  const browserFailures = createBrowserFailureMonitor(page);

  await login(page, accounts.user);
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('navigation')).toBeVisible();

  await navigateFromCatalogMenu(page, /Movies|Filme/i);
  await expect(page).toHaveURL(/\/movies$/);

  await navigateFromCatalogMenu(page, /Series|Serien/i);
  await expect(page).toHaveURL(/\/series$/);

  await navigateFromCatalogMenu(page, /Home|Startseite/i);
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('button', { name: /Account|Konto/i }).click();
  await page.getByRole('button', { name: /Sign out of Netflix|Von Netflix abmelden/i }).click();
  await expect(page).toHaveURL(/\/auth\/login/);

  browserFailures.assertNone();
});

test('normal user can sign out from the profile selection screen', async ({ page }) => {
  const browserFailures = createBrowserFailureMonitor(page);

  await login(page, accounts.user);
  await page.goto('/profiles');

  await expect(page.getByRole('heading', { name: /Who is watching|Wer schaut gerade/i }))
    .toBeVisible();
  await page.getByRole('button', { name: /Logout|Abmelden/i }).click();
  await expect(page).toHaveURL(/\/auth\/login/);

  browserFailures.assertNone();
});
