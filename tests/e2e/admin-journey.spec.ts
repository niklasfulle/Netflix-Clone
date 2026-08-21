import { expect, test } from '@playwright/test';

import {
  assertSafeE2EDataTarget,
  authStatePaths,
  createBrowserFailureMonitor,
} from './support';

async function setReactInputValue(
  locator: import('@playwright/test').Locator,
  value: string,
) {
  await locator.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, nextValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test.describe('normal user permissions', () => {
  test.use({ storageState: authStatePaths.user });

  test('normal users cannot access administration', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/profiles$/);
    await expect(page.getByText(/Who.*watching|Wer schaut/i)).toBeVisible();
    browserFailures.assertNone();
  });
});

test.describe('admin management', () => {
  test.use({ storageState: authStatePaths.admin });

  test('admin can inspect deployment evidence on desktop and mobile', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);

    await page.goto('/admin/system');
    await expect(page.getByRole('heading', { name: /System/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Deployment Status' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open backup evidence' }))
      .toHaveAttribute('href', '/admin/backups');
    await expect(page.getByRole('link', { name: 'Open container logs' }))
      .toHaveAttribute('href', '/admin/logs');

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
    browserFailures.assertNone();
  });

  test('admin can inspect media-health controls on desktop and mobile', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);

    await page.goto('/admin/media-health');
    await expect(page.getByRole('heading', { name: /Media Health|Medienzustand/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Scan full catalog|Gesamten Katalog prüfen/i })).toBeVisible();
    await expect(page.getByText(/Scanner (available|unavailable)|Scanner (verfügbar|nicht verfügbar)/i)).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);

    const filteredResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === '/api/admin/media-health'
        && url.searchParams.get('severity') === 'CRITICAL'
        && response.ok();
    });
    await page.getByRole('combobox', { name: /Filter by severity|Nach Schweregrad filtern/i })
      .selectOption('CRITICAL');
    await filteredResponse;
    await page.getByRole('button', { name: /Reset filters|Filter zurücksetzen/i }).click();

    await expect(page.getByRole('textbox', { name: /Content ID|Inhalts-ID/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start content scan|Inhalt prüfen/i })).toBeDisabled();

    browserFailures.assertNone();
  });

  test('admin can filter and export correlated audit events', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);
    await assertSafeE2EDataTarget(page.request);
    const actorName = `E2E Audit Actor ${Date.now()}`;
    let actorId: string | undefined;

    try {
      const created = await page.request.post('/api/actors', { data: { name: actorName } });
      expect(created.ok()).toBe(true);
      actorId = (await created.json() as { id: string }).id;

      const deleted = await page.request.delete(`/api/actors?id=${encodeURIComponent(actorId)}`);
      expect(deleted.ok()).toBe(true);

      await page.goto('/admin/audit');
      await expect(page.getByRole('heading', { name: /Audit Log|Audit-Protokoll/i })).toBeVisible();
      await page.getByRole('combobox', { name: /Filter by action|Nach Aktion filtern/i }).selectOption('actor.delete');
      await page.getByRole('combobox', { name: /Filter by target type|Nach Zieltyp filtern/i }).selectOption('actor');
      const filteredResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return url.pathname === '/api/admin/audit'
          && url.searchParams.get('action') === 'actor.delete'
          && url.searchParams.get('targetType') === 'actor'
          && url.searchParams.get('outcome') === 'SUCCEEDED'
          && response.ok();
      });
      await page.getByRole('combobox', { name: /Filter by outcome|Nach Ergebnis filtern/i }).selectOption('SUCCEEDED');
      await filteredResponse;

      await expect(page.getByRole('link', { name: actorId, exact: true })).toBeVisible();
      const exportLink = page.getByRole('link', { name: /Export CSV|CSV exportieren/i });
      await expect(exportLink).toHaveAttribute('href', /action=actor.delete/);
      await expect(exportLink).toHaveAttribute('href', /targetType=actor/);
      await expect(exportLink).toHaveAttribute('href', /outcome=SUCCEEDED/);
      actorId = undefined;
      browserFailures.assertNone();
    } finally {
      if (actorId) {
        await page.request.delete(`/api/actors?id=${encodeURIComponent(actorId)}`);
      }
    }
  });

  test('admin can create and remove an actor', async ({ page }) => {
    const browserFailures = createBrowserFailureMonitor(page);
    await page.goto('/admin/actors');
    await expect(page).toHaveURL(/\/admin\/actors$/);

    const actorName = `E2E Actor ${Date.now()}`;
    let actorId: string | undefined;

    try {
      await page.getByRole('button', { name: /Darsteller hinzufügen|Add actor/i }).click();
      const dialog = page.getByRole('dialog', { name: /Darsteller hinzufügen|Add actor/i });
      await dialog.getByRole('textbox', { name: /Name/i }).fill(actorName);

      const actorResponse = page.waitForResponse((response) =>
        response.url().includes('/api/actors')
        && response.request().method() === 'POST'
        && response.ok()
      );
      await dialog.getByRole('button', { name: /Darsteller anlegen|Create actor/i }).click();
      actorId = (await (await actorResponse).json() as { id: string }).id;

      await expect(page.getByText(/Darsteller wurde hinzugefügt|Actor was added/i)).toBeVisible();
      await page.getByRole('textbox', { name: /Darsteller suchen|Search actors/i }).fill(actorName);
      await expect(page.getByRole('cell', { name: actorName, exact: true })).toBeVisible();

      page.once('dialog', (confirmation) => confirmation.accept());
      await page.getByRole('button', { name: new RegExp(`${actorName} (löschen|delete)`, 'i') }).click();
      await expect(page.getByText(/Darsteller wurde gelöscht|Actor was deleted/i)).toBeVisible();
      actorId = undefined;
      browserFailures.assertNone();
    } finally {
      if (actorId) {
        await page.request.delete(`/api/actors?id=${actorId}`);
      }
    }
  });

  test('admin can create, edit, and remove content with an inline actor', async ({ page }) => {
    test.setTimeout(90_000);
    const browserFailures = createBrowserFailureMonitor(page);
    const suffix = Date.now();
    const actorName = `E2E Content Actor ${suffix}`;
    const movieName = `E2E Content ${suffix}`;
    const updatedMovieName = `${movieName} Updated`;
    let actorId: string | undefined;
    let movieId: string | undefined;

    try {
      await page.goto('/admin/movies/new');
      await expect(page.getByRole('heading', { name: /Add New Content/i })).toBeVisible();

      await page.getByRole('textbox', { name: /Name/i }).first().fill(movieName);
      await page.getByRole('textbox', { name: /Description|Beschreibung/i }).fill('Playwright lifecycle content');

      await page.getByRole('button', { name: /Neuen Darsteller anlegen|Create new actor/i }).click();
      await page.getByRole('textbox', { name: /Name des Darstellers|Actor name/i }).fill(actorName);
      const actorResponse = page.waitForResponse((response) =>
        response.url().includes('/api/actors')
        && response.request().method() === 'POST'
        && response.ok()
      );
      await page.getByRole('button', { name: /Darsteller anlegen|Create actor/i }).click();
      actorId = (await (await actorResponse).json() as { id: string }).id;
      await expect(page.getByText(new RegExp(`${actorName}.*(angelegt|created)`, 'i'))).toBeVisible();

      await page.getByRole('combobox', { name: /Type|Typ/i }).click();
      await page.getByRole('option', { name: /Movie|Film/i }).click();
      await page.getByRole('combobox', { name: /Genre/i }).click();
      await page.getByRole('option').first().click();

      await setReactInputValue(page.locator('input[name="movieDuration"]'), '00:00:05');
      await setReactInputValue(page.locator('input[name="movieVideo"]'), `e2e-video-${suffix}`);
      await page.locator('#thumbnail-upload').setInputFiles('public/images/hero.jpg');
      await expect(page.getByRole('img', { name: /Selected Thumbnail/i })).toBeVisible();

      await page.getByRole('button', { name: /Save Content|Inhalt speichern/i }).click();
      await expect(page.getByText(/Movie added|Inhalt.*hinzugefügt/i)).toBeVisible();

      await page.goto('/admin/movies');
      await page.getByRole('textbox', { name: /Inhalte suchen|Search content/i }).fill(movieName);
      const editLink = page.getByRole('link', { name: new RegExp(`${movieName} (bearbeiten|edit)`, 'i') });
      await expect(editLink).toBeVisible();
      const editHref = await editLink.getAttribute('href');
      movieId = editHref?.match(/\/admin\/movies\/([^/]+)\/edit/)?.[1];
      await editLink.click();

      const nameField = page.getByRole('textbox', { name: /Name/i }).first();
      await expect(nameField).toHaveValue(movieName);
      await nameField.fill(updatedMovieName);
      await page.getByRole('button', { name: /Änderungen speichern|Save changes/i }).click();
      await expect(page.getByText(/Movie updated|Inhalt.*aktualisiert/i)).toBeVisible();

      await page.getByRole('button', { name: /Inhalt löschen|Delete content/i }).click();
      await page.getByRole('button', { name: /Jetzt löschen|Delete now/i }).click();
      await expect(page).toHaveURL(/\/admin\/movies$/);
      movieId = undefined;
      await page.goBack();
      await expect(page).toHaveURL(/\/admin\/movies$/);
      browserFailures.assertNone();
      await page.getByRole('textbox', { name: /Inhalte suchen|Search content/i }).fill(updatedMovieName);
      await expect(page.getByRole('link', {
        name: new RegExp(`${updatedMovieName} (bearbeiten|edit)`, 'i'),
      })).toHaveCount(0);
      movieId = undefined;
      actorId = undefined;
      browserFailures.assertNone();
    } finally {
      if (movieId) {
        await page.goto(`/admin/movies/${movieId}/edit`);
        const deleteButton = page.getByRole('button', { name: /Inhalt löschen|Delete content/i });
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.getByRole('button', { name: /Jetzt löschen|Delete now/i }).click();
        }
      }
      if (actorId) {
        await page.request.delete(`/api/actors?id=${actorId}`);
      }
    }
  });
});
