import { expect, test, type Page } from '@playwright/test';

import { createTotpCode } from '@/lib/authentication/mfa-crypto';

import {
  accounts,
  assertSafeE2EDataTarget,
  createBrowserFailureMonitor,
  login,
  resetAccountMfa,
} from './support';

const recoveryCodePattern = /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){2}$/;

async function waitForFreshTotpWindow() {
  const millisecondsUntilNextWindow = 30_000 - (Date.now() % 30_000) + 1_250;
  await new Promise((resolve) => setTimeout(resolve, millisecondsUntilNextWindow));
}

async function submitCredentials(page: Page) {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: /Email|E-Mail/i }).fill(accounts.user.email);
  await page.locator('input[autocomplete="current-password"]').fill(accounts.user.password);
  await page.getByRole('button', { name: /Login|Anmelden/i }).click();
}

test.describe('multi-factor authentication journey', () => {
  let dataTargetVerified = false;
  test.describe.configure({ mode: 'serial' });
  test.beforeAll(async ({ request }) => {
    await assertSafeE2EDataTarget(request);
    dataTargetVerified = true;
    await resetAccountMfa(accounts.user.email);
  });
  test.afterAll(async () => {
    if (dataTargetVerified) await resetAccountMfa(accounts.user.email);
  });

  test('user can enroll TOTP, pass a dedicated login challenge, and disable MFA', async ({ page }) => {
    test.setTimeout(180_000);

    const browserFailures = createBrowserFailureMonitor(page, {
      allowedApiFailures: {
        '/api/security/certificates': [503],
      },
    });
    await login(page, accounts.user);
    let secret = '';

      await page.goto('/settings');
      await page.getByLabel(/Current password for MFA|Aktuelles Passwort für MFA/i)
        .fill(accounts.user.password);
      await page.getByRole('button', { name: /Set up authenticator|Authenticator einrichten/i })
        .click();

      await expect(page.getByText(
        /Add this account to your authenticator app|Füge dieses Konto zu deiner Authenticator-App hinzu/i,
      )).toBeVisible();
      secret = (await page.locator('code').filter({ hasText: /^[A-Z2-7]{16,}$/ }).textContent())?.trim() ?? '';
      expect(secret).not.toBe('');

      await page.getByLabel(/Authenticator setup code|Authenticator-Einrichtungscode/i)
        .fill(createTotpCode(secret));
      await page.getByRole('button', { name: /Verify and enable|Bestätigen und aktivieren/i })
        .click();

      const recoveryHeading = page.getByRole('heading', {
        name: /Save your recovery codes|Speichere deine Wiederherstellungscodes/i,
      });
      await expect(recoveryHeading).toBeVisible();
      const recoveryCodes = (await page.locator('code').allTextContents())
        .map((code) => code.trim())
        .filter((code) => recoveryCodePattern.test(code));
      expect(recoveryCodes.length).toBeGreaterThanOrEqual(8);
      await page.getByRole('button', {
        name: /I saved my recovery codes|Ich habe meine Wiederherstellungscodes gespeichert/i,
      }).click();

      await page.goto('/profiles');
      await page.getByRole('button', {
        name: /Logout|Abmelden|Sign out of Netflix|Von Netflix abmelden/i,
      }).click();
      await expect(page).toHaveURL(/\/auth\/login/);

      await waitForFreshTotpWindow();
      await submitCredentials(page);
      await expect(page.getByRole('heading', { name: /Security check|Sicherheitsprüfung/i }))
        .toBeVisible();
      await page.getByLabel(/Authenticator code|Authenticator-Code/i).fill(createTotpCode(secret));
      await page.getByRole('button', { name: /Confirm|Bestätigen/i }).click();
      await expect(page).toHaveURL(/\/profiles/);

      await page.goto('/settings');
      await page.getByLabel(/Current password for MFA|Aktuelles Passwort für MFA/i)
        .fill(accounts.user.password);
      await page.getByLabel(/MFA or recovery code|MFA- oder Wiederherstellungscode/i)
        .fill(recoveryCodes[0]);
      await page.getByRole('button', { name: /Disable MFA|MFA deaktivieren/i }).click();
      await expect(page.getByRole('button', {
        name: /Set up authenticator|Authenticator einrichten/i,
      })).toBeVisible();

      browserFailures.assertNone();
  });
});
