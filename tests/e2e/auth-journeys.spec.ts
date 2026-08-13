import { expect, test } from '@playwright/test';

import { accounts, createBrowserFailureMonitor } from './support';

test.describe('public authentication journeys', () => {
  test('password controls and registration validation remain accessible and responsive', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);
    await page.goto('/auth/login');

    const currentPassword = page.locator('input[autocomplete="current-password"]');
    await expect(currentPassword).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /Show password|Passwort anzeigen/i }).click();
    await expect(currentPassword).toHaveAttribute('type', 'text');

    await page.goto('/auth/register');
    const passwordFields = page.locator('input[autocomplete="new-password"]');
    await passwordFields.nth(0).fill('long-enough-password');
    await passwordFields.nth(1).fill('different-password');
    await expect(page.getByText(/At least 12 characters|Mindestens 12 Zeichen/i))
      .toHaveAttribute('data-complete', 'true');
    await expect(page.getByText(/Passwords match|Passwörter stimmen überein/i))
      .toHaveAttribute('data-complete', 'false');

    await page.getByRole('button', { name: /Register|Registrieren/i }).click();
    await expect(page.getByText(/Passwords don't match|Passwörter stimmen nicht überein/i))
      .toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);

    browserFailures.assertNone();
  });

  test('reset and expired verification pages explain the next step', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);
    await page.goto('/auth/reset');
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send reset email|Reset-E-Mail senden/i }))
      .toBeEnabled();

    await page.goto('/auth/new-verification');
    await expect(page.getByText(/Missing token|Token fehlt/i)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);

    browserFailures.assertNone();
  });

  test('success states replace completed forms and resend remains keyboard accessible', async (
    { page },
    testInfo,
  ) => {
    const browserFailures = createBrowserFailureMonitor(page);
    const existingAccount = testInfo.project.name === 'mobile' ? accounts.admin : accounts.user;
    const unknownEmail = `auth-journey-${testInfo.project.name}@example.invalid`;

    await page.clock.install();
    await page.goto('/auth/register');
    await page.getByRole('textbox', { name: /Full name|Vollständiger Name/i })
      .fill('Playwright Viewer');
    await page.getByRole('textbox', { name: /Email|E-Mail/i }).fill(existingAccount.email);
    const registrationPasswords = page.locator('input[autocomplete="new-password"]');
    await registrationPasswords.nth(0).fill('Valid-test-password-123');
    await registrationPasswords.nth(1).fill('Valid-test-password-123');
    await page.getByRole('button', { name: /Register|Registrieren/i }).click();

    await expect(page.getByRole('heading', { name: /Check your email|Prüfe deine E-Mail/i }))
      .toBeVisible();
    await expect(page.getByRole('button', { name: /Register|Registrieren/i })).toHaveCount(0);
    await expect(page.getByText(existingAccount.email)).toBeVisible();

    await page.clock.runFor(60_000);
    const verificationResend = page.getByRole('button', { name: /Send again|Erneut senden/i });
    await expect(verificationResend).toBeEnabled();
    await verificationResend.focus();
    await verificationResend.press('Enter');
    await expect(page.locator('output[aria-live="polite"]'))
      .toContainText(/sent again|resend|erneut gesendet|erneut senden/i, { timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Resend available in|Erneut.* in/i }))
      .toBeDisabled();

    await page.goto('/auth/reset');
    await page.getByRole('textbox', { name: /Email|E-Mail/i }).fill(unknownEmail);
    await page.getByRole('button', { name: /Send reset email|Reset-E-Mail senden/i }).click();

    await expect(page.getByRole('heading', { name: /Check your email|Prüfe deine E-Mail/i }))
      .toBeVisible();
    await expect(page.getByRole('button', { name: /Send reset email|Reset-E-Mail senden/i }))
      .toHaveCount(0);
    await expect(page.getByText(unknownEmail)).toBeVisible();

    await page.clock.runFor(60_000);
    const resetResend = page.getByRole('button', { name: /Send again|Erneut senden/i });
    await expect(resetResend).toBeEnabled();
    await resetResend.focus();
    await resetResend.press('Enter');
    await expect(page.locator('output[aria-live="polite"]'))
      .toContainText(/sent again|resend|erneut gesendet|erneut senden/i, { timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Resend available in|Erneut.* in/i }))
      .toBeDisabled();

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    browserFailures.assertNone();
  });
});
