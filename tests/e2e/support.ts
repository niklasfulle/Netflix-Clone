import { expect, type Page } from '@playwright/test';

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Add it to .env.e2e.local before running Playwright.`);
  if (value === 'replace-me' || value.endsWith('@example.test')) {
    throw new Error(`${name} still contains the example placeholder.`);
  }
  if (value !== value.trim()) throw new Error(`${name} contains leading or trailing whitespace.`);
  return value;
}

export const accounts = {
  user: {
    email: requiredEnvironmentVariable('E2E_USER_EMAIL'),
    password: requiredEnvironmentVariable('E2E_USER_PASSWORD'),
  },
  admin: {
    email: requiredEnvironmentVariable('E2E_ADMIN_EMAIL'),
    password: requiredEnvironmentVariable('E2E_ADMIN_PASSWORD'),
  },
};

export const authStatePaths = {
  user: 'output/playwright/.auth/user.json',
  admin: 'output/playwright/.auth/admin.json',
};

export async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: /Email|E-Mail/i }).fill(account.email);
  await page.getByLabel(/Password|Passwort/i).fill(account.password);
  await page.getByRole('button', { name: /Login|Anmelden/i }).click();

  const authenticationFeedback = page.getByText(
    /Invalid credentials|Confirmation email sent|Too many attempts|Something went wrong|Invalid fields/i,
  );
  const twoFactorField = page.getByLabel(/2FA Code/i);
  await expect.poll(async () => {
    if (new URL(page.url()).pathname !== '/auth/login') return 'redirected';
    if (await authenticationFeedback.isVisible()) return 'feedback';
    if (await twoFactorField.isVisible()) return 'two-factor';
    return 'pending';
  }, { timeout: 20_000 }).not.toBe('pending');

  if (await authenticationFeedback.isVisible()) {
    throw new Error(`Login failed: ${await authenticationFeedback.textContent()}`);
  }
  if (await twoFactorField.isVisible()) {
    throw new Error('The E2E account requires two-factor authentication.');
  }
}

export async function selectFirstProfile(page: Page) {
  await page.goto('/profiles');
  const profileButton = page.getByRole('button', {
    name: /Select profile|Profil auswählen/i,
  }).first();
  await expect(profileButton).toBeVisible();
  await profileButton.click();
  await expect(page).toHaveURL(/\/$/);
}

export function createBrowserFailureMonitor(page: Page) {
  const consoleErrors: string[] = [];
  const failedApiResponses: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const location = message.location().url;
      consoleErrors.push(`${message.text()}${location ? ` (${location})` : ''}`);
    }
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(`Uncaught page error: ${error.message}`);
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/') && response.status() >= 400) {
      failedApiResponses.push(`${response.status()} ${url.pathname}`);
    }
  });

  return {
    assertNone() {
      expect(consoleErrors, 'unexpected browser console errors').toEqual([]);
      expect(failedApiResponses, 'failed API responses').toEqual([]);
    },
  };
}
