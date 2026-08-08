import { expect, test } from '@playwright/test';

import { authStatePaths, createBrowserFailureMonitor } from './support';

test.describe('user settings', () => {
  test.use({ storageState: authStatePaths.user });

  test('user can review, reset, localize, and validate account settings safely', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);
    await page.goto('/settings');

    await expect(page.getByRole('heading', {
      name: /Your account, your preferences|Dein Konto, deine Einstellungen/i,
    })).toBeVisible();

    const nameField = page.getByRole('textbox', { name: /^Name$/i });
    const originalName = await nameField.inputValue();
    await nameField.fill(`${originalName} E2E preview`);
    await expect(page.getByText(/You have unsaved changes|Du hast ungespeicherte Änderungen/i)).toBeVisible();
    await page.getByRole('button', { name: /Reset|Zurücksetzen/i }).click();
    await expect(nameField).toHaveValue(originalName);

    const language = page.locator('#preferences').getByRole('group', { name: /Language|Sprache/i });
    await language.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Dein Konto, deine Einstellungen/i })).toBeVisible();
    await language.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Your account, your preferences/i })).toBeVisible();

    await page.getByRole('textbox', { name: /Current password/i }).fill('not-sent-to-the-server');
    await page.getByRole('button', { name: /Save changes/i }).click();
    await expect(page.getByText(/New password is required/i)).toBeVisible();
    browserFailures.assertNone();
  });
});

test.describe('backup validation', () => {
  test.use({ storageState: authStatePaths.admin });

  test('admin receives validation feedback without starting a backup mutation', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);
    const backupMutations: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/api/admin/backups' && ['POST', 'PUT'].includes(request.method())) {
        backupMutations.push(request.method());
      }
    });

    await page.goto('/admin/backups');
    await expect(page.getByRole('heading', { name: /Database Backups/i })).toBeVisible();
    const validationAlert = page.locator('main [role="alert"]');

    const createSection = page.getByRole('heading', { name: /Create Backup/i }).locator('xpath=ancestor::section');
    const createPassword = createSection.getByLabel('Backup Password', { exact: true });
    const repeatPassword = createSection.getByLabel('Repeat Password', { exact: true });
    await createPassword.fill('short');
    await repeatPassword.fill('short');
    await createSection.getByRole('button', { name: /Create and Download Backup/i }).click();
    await expect(validationAlert).toContainText('at least 12 characters');

    await createPassword.fill('long-enough-password');
    await repeatPassword.fill('different-password');
    await createSection.getByRole('button', { name: /Create and Download Backup/i }).click();
    await expect(validationAlert).toContainText('do not match');

    const restoreSection = page.getByRole('heading', { name: /Restore Backup/i }).locator('xpath=ancestor::section');
    await restoreSection.getByRole('button', { name: /Restore Database Backup/i }).click();
    await expect(validationAlert).toContainText('Select a .nfbak backup file');

    await restoreSection.getByLabel('Backup File').setInputFiles({
      name: 'validation-only.nfbak',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('not-a-real-backup'),
    });
    await restoreSection.getByLabel('Backup Password', { exact: true }).fill('short');
    await restoreSection.getByRole('button', { name: /Restore Database Backup/i }).click();
    await expect(validationAlert).toContainText('at least 12 characters');

    await restoreSection.getByLabel('Backup Password', { exact: true }).fill('long-enough-password');
    await restoreSection.getByRole('button', { name: /Restore Database Backup/i }).click();
    await expect(validationAlert).toContainText('Enter RESTORE');

    expect(backupMutations).toEqual([]);
    browserFailures.assertNone();
  });
});
