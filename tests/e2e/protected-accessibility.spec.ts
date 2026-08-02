import { expect, type Locator, type Page, test } from '@playwright/test';

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.e2e.local before running Playwright.`);
  }
  if (value === 'replace-me' || value.endsWith('@example.test')) {
    throw new Error(`${name} still contains the example placeholder. Replace the existing line instead of adding a duplicate.`);
  }
  if (value !== value.trim()) {
    throw new Error(`${name} contains leading or trailing whitespace.`);
  }
  return value;
}

const accounts = {
  user: {
    email: requiredEnvironmentVariable('E2E_USER_EMAIL'),
    password: requiredEnvironmentVariable('E2E_USER_PASSWORD'),
  },
  admin: {
    email: requiredEnvironmentVariable('E2E_ADMIN_EMAIL'),
    password: requiredEnvironmentVariable('E2E_ADMIN_PASSWORD'),
  },
};

async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/auth/login');
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.pressSequentially(account.email);
  await passwordInput.pressSequentially(account.password);

  const fieldsContainExpectedValues = await Promise.all([
    emailInput.inputValue().then((value) => value === account.email),
    passwordInput.inputValue().then((value) => value === account.password),
  ]);
  if (fieldsContainExpectedValues.includes(false)) {
    throw new Error('Playwright did not transfer the complete E2E credentials into the login form.');
  }

  await passwordInput.press('Tab');
  await page.locator('button[type="submit"]').press('Enter');

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
    throw new Error('The E2E account requires two-factor authentication. Disable 2FA for this dedicated test account.');
  }
}

async function expectFocusWithin(container: Locator) {
  await expect.poll(() => container.evaluate((element) => (
    element.contains(document.activeElement)
  ))).toBe(true);
}

test.describe.configure({ mode: 'serial' });

test('prevents a normal user from opening the admin area', async ({ page }) => {
  await login(page, accounts.user);

  await page.goto('/admin');

  await expect(page).toHaveURL(/\/profiles(?:\?.*)?$/);
  await expect(page.getByRole('navigation', { name: /Admin Area|Admin-Bereich/i })).toHaveCount(0);
});

test('keeps keyboard focus inside protected admin navigation and dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, accounts.admin);
  await page.goto('/admin');

  const navigationTrigger = page.getByRole('button', {
    name: /Open navigation|Navigation öffnen/i,
  });
  await navigationTrigger.focus();
  await page.keyboard.press('Enter');

  const navigationDialog = page.getByRole('dialog', {
    name: /Admin Area|Admin-Bereich/i,
  });
  await expect(navigationDialog).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expectFocusWithin(navigationDialog);

  await page.keyboard.press('Shift+Tab');
  await expectFocusWithin(navigationDialog);
  await page.keyboard.press('Escape');

  await expect(navigationDialog).toBeHidden();
  await expect(navigationTrigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/admin/actors');

  const actorDialogTrigger = page.getByRole('button', { name: 'Darsteller hinzufügen' });
  await actorDialogTrigger.focus();
  await page.keyboard.press('Enter');

  const actorDialog = page.getByRole('dialog', { name: 'Darsteller hinzufügen' });
  await expect(actorDialog).toBeVisible();
  await expectFocusWithin(actorDialog);

  await page.keyboard.press('Tab');
  await expectFocusWithin(actorDialog);
  await page.keyboard.press('Escape');

  await expect(actorDialog).toBeHidden();
  await expect(actorDialogTrigger).toBeFocused();
});
