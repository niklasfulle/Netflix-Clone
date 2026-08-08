import { expect, type Locator, test } from '@playwright/test';

import { authStatePaths } from './support';

async function expectFocusWithin(container: Locator) {
  await expect.poll(() => container.evaluate((element) => (
    element.contains(document.activeElement)
  ))).toBe(true);
}

test.describe.configure({ mode: 'serial' });

test.describe('normal-user accessibility', () => {
  test.use({ storageState: authStatePaths.user });

  test('prevents a normal user from opening the admin area', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/profiles(?:\?.*)?$/);
    await expect(page.getByRole('navigation', { name: /Admin Area|Admin-Bereich/i })).toHaveCount(0);
  });

  test('uses accessible profile controls for creation and keyboard selection', async ({ page }) => {
    await page.goto('/profiles');

    const addProfileButton = page.getByRole('button', {
      name: /Add Profile|Profil hinzufügen/i,
    });
    await addProfileButton.focus();
    await expect(addProfileButton).toBeFocused();
    await addProfileButton.press('Enter');

    await expect(page.getByRole('button', {
      name: /Back to profiles|Zurück zu den Profilen/i,
    })).toBeVisible();
    await expect(page.getByRole('button', {
      name: /Choose profile image|Profilbild auswählen/i,
    })).toBeVisible();
    await expect(page.getByRole('button', {
      name: /Save profile|Profil speichern/i,
    })).toBeVisible();
    await page.getByRole('textbox', { name: /Name/i }).fill('Accessibility check');
    await page.getByRole('button', {
      name: /Back to profiles|Zurück zu den Profilen/i,
    }).press('Space');

    const profileButton = page.getByRole('button', {
      name: /Select profile|Profil auswählen/i,
    }).first();
    await profileButton.focus();
    await expect(profileButton).toBeFocused();
    await profileButton.press('Enter');

    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('admin accessibility', () => {
  test.use({ storageState: authStatePaths.admin });

  test('keeps keyboard focus inside protected admin navigation and dialogs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
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
});
