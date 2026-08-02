import { expect, test } from '@playwright/test';

test('changes the login language using only the keyboard', async ({ page }) => {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  const germanButton = page.getByRole('button', { name: 'DE', exact: true });
  let languageButtonFocused = false;
  for (let index = 0; index < 50; index += 1) {
    await page.keyboard.press('Tab');
    languageButtonFocused = await germanButton.evaluate((element) => (
      document.activeElement === element
    ));
    if (languageButtonFocused) break;
  }

  expect(languageButtonFocused).toBe(true);
  await expect(germanButton).toBeFocused();
  await germanButton.press('Enter');

  await expect(germanButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByText('Willkommen zurück')).toBeVisible();
  const loginButton = page.getByRole('button', { name: 'Anmelden' });
  await expect(loginButton).toBeVisible();

  await loginButton.click();
  await expect(page.getByText('E-Mail ist erforderlich.')).toBeVisible();
  await expect(page.getByText('Passwort ist erforderlich.')).toBeVisible();

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Email is required.')).toBeVisible();
  await expect(page.getByText('Password is required.')).toBeVisible();
});
