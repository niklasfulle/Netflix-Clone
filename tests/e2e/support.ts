import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { db } from '@/lib/db';

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

export async function assertSafeE2EDataTarget(request: APIRequestContext) {
  const healthResponse = await request.get('/api/health');
  if (!healthResponse.ok()) {
    throw new Error(`E2E target health check failed with HTTP ${healthResponse.status()}.`);
  }

  const health = await healthResponse.json() as { environment?: string };
  const environment = health.environment?.trim().toLowerCase();
  if (environment === 'production') {
    throw new Error('Database-mutating E2E tests are forbidden against production.');
  }
  if (environment !== 'staging') {
    throw new Error(`Database-mutating E2E tests require staging; received '${environment ?? 'unknown'}'.`);
  }

  const rows = await db.$queryRaw<Array<{ databaseName: string }>>`
    SELECT current_database() AS "databaseName"
  `;
  const databaseName = rows[0]?.databaseName?.trim().toLowerCase() ?? '';
  if (!databaseName.includes('stage') && !databaseName.includes('staging')) {
    throw new Error(
      `Playwright is connected to '${databaseName || 'unknown'}', not an isolated staging database.`,
    );
  }
}

export async function resetAccountMfa(email: string) {
  await db.$transaction([
    db.$executeRaw`
      DELETE FROM "MfaRecoveryCode"
      WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email" = ${email})
    `,
    db.$executeRaw`
      DELETE FROM "MfaAuthenticator"
      WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email" = ${email})
    `,
    db.$executeRaw`
      DELETE FROM "TwoFactorConfirmation"
      WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email" = ${email})
    `,
    db.$executeRaw`
      UPDATE "User"
      SET "isTwoFactorEnabled" = false
      WHERE "email" = ${email}
    `,
  ]);
}

export async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: /Email|E-Mail/i }).fill(account.email);
  await page.locator('input[autocomplete="current-password"]').fill(account.password);
  await page.getByRole('button', { name: /Login|Anmelden/i }).click();

  const authenticationFeedback = page.getByText(
    /Invalid credentials|Confirmation email sent|Too many attempts|Something went wrong|Invalid fields/i,
  );
  const twoFactorField = page.getByLabel(
    /Authenticator code|Email verification code|Recovery code|2FA Code|Authenticator-Code|E-Mail-Bestätigungscode|Wiederherstellungscode/i,
  );
  await expect.poll(async () => {
    if (new URL(page.url()).pathname !== '/auth/login') return 'redirected';
    if (await authenticationFeedback.isVisible()) return 'feedback';
    if (await twoFactorField.isVisible()) return 'two-factor';
    return 'pending';
  }, { timeout: 20_000 }).not.toBe('pending');

  if (new URL(page.url()).pathname !== '/auth/login') return;

  const feedbackText = await authenticationFeedback.textContent({ timeout: 1_000 })
    .catch(() => null);
  if (feedbackText) {
    throw new Error(`Login failed: ${feedbackText}`);
  }
  if (new URL(page.url()).pathname !== '/auth/login') return;
  if (await twoFactorField.isVisible()) {
    throw new Error('The E2E account requires two-factor authentication.');
  }
}

export async function selectFirstProfile(page: Page) {
  await page.goto('/profiles');
  const profileButton = page.getByRole('button', {
    name: /Select profile|Profil auswählen/i,
  }).first();
  if (await profileButton.count() === 0) {
    await expect(page.getByRole('button', { name: /Add Profile|Profil hinzufügen/i }))
      .toBeVisible();
    return;
  }
  await expect(profileButton).toBeVisible();
  await profileButton.click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
}

interface BrowserFailureMonitorOptions {
  allowedApiFailures?: Readonly<Record<string, readonly number[]>>;
}

export function createBrowserFailureMonitor(
  page: Page,
  options: BrowserFailureMonitorOptions = {},
) {
  const consoleErrors: string[] = [];
  const failedApiResponses: string[] = [];
  const allowedApiFailures = options.allowedApiFailures ?? {};

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const location = message.location().url;
      const pathname = location ? new URL(location).pathname : '';
      if (!(pathname in allowedApiFailures)) {
        consoleErrors.push(`${message.text()}${location ? ` (${location})` : ''}`);
      }
    }
  });
  page.on('pageerror', (error) => {
    consoleErrors.push(`Uncaught page error: ${error.message}`);
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/') && response.status() >= 400) {
      const allowedStatuses = allowedApiFailures[url.pathname] ?? [];
      if (!allowedStatuses.includes(response.status())) {
        failedApiResponses.push(`${response.status()} ${url.pathname}`);
      }
    }
  });

  return {
    assertNone() {
      expect(consoleErrors, 'unexpected browser console errors').toEqual([]);
      expect(failedApiResponses, 'failed API responses').toEqual([]);
    },
  };
}
