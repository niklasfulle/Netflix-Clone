import { expect, test } from '@playwright/test';

import { db } from '@/lib/db';
import {
  accounts,
  assertSafeE2EDataTarget,
  createBrowserFailureMonitor,
  login,
} from './support';

test.skip(
  process.env.AUTH_PASSKEYS_ENABLED !== 'true',
  'Enable the feature-flagged passkey pilot to run this browser journey.',
);

async function unlockPasskeySettings(
  page: import('@playwright/test').Page,
  password: string,
) {
  const passwordInput = page.getByLabel(/Current password for passkeys|Aktuelles Passwort für Passkeys/i);
  const addButton = page.getByRole('button', {
    name: /Add a passkey|Passkey hinzufügen/i,
  });
  await expect.poll(async () => {
    if (await addButton.isVisible().catch(() => false)) return 'unlocked';
    if (await passwordInput.isVisible().catch(() => false)) return 'locked';
    return 'loading';
  }, { timeout: 15_000 }).not.toBe('loading');
  if (await addButton.isVisible()) return;

  await passwordInput.fill(password);
  await page.getByRole('button', {
    name: /Unlock passkey settings|Passkey-Einstellungen entsperren/i,
  }).click();
  await expect(addButton).toBeVisible();
}

async function signOut(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Account|Konto/i }).click();
  await page.getByRole('button', {
    name: /Sign out of Netflix|Von Netflix abmelden/i,
  }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
}

test('enrolls, uses, names, and removes a passkey while password fallback remains available', async ({ page }) => {
  test.setTimeout(90_000);
  await assertSafeE2EDataTarget(page.request);
  const account = test.info().project.name === 'mobile' ? accounts.admin : accounts.user;
  const user = await db.user.findUniqueOrThrow({
    where: { email: account.email },
    select: { id: true },
  });
  await db.$transaction([
    db.passkeyManagementGrant.deleteMany({ where: { userId: user.id } }),
    db.authenticator.deleteMany({ where: { userId: user.id } }),
    db.account.deleteMany({ where: { userId: user.id, provider: 'passkey' } }),
  ]);
  await login(page, account);
  const browserFailures = createBrowserFailureMonitor(page);
  const client = await page.context().newCDPSession(page);
  await client.send('WebAuthn.enable');
  const initialAuthenticator = await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  let authenticatorId = initialAuthenticator.authenticatorId;
  await page.goto('/settings#security');
  await unlockPasskeySettings(page, account.password);
  await page.getByRole('button', { name: /Add a passkey|Passkey hinzufügen/i }).click();
  await expect.poll(async () => {
    const result = await client.send('WebAuthn.getCredentials', { authenticatorId });
    return result.credentials.length;
  }, { timeout: 15_000 }).toBe(1);
  await expect(page).toHaveURL(/\/settings(?:#security)?$/);

  const virtualCredentials = await client.send('WebAuthn.getCredentials', { authenticatorId });
  expect(virtualCredentials.credentials).toHaveLength(1);
  await expect.poll(async () => db.authenticator.count({
    where: { userId: user.id },
  }), { timeout: 15_000 }).toBe(1);

  await page.goto('/settings#security');
  await unlockPasskeySettings(page, account.password);
  const labelInput = page.locator('input[id^="passkey-"]');
  await expect(labelInput).toHaveCount(1);
  await expect(labelInput).toBeVisible();
  await labelInput.fill(`${test.info().project.name} browser`);
  await labelInput.locator('xpath=following-sibling::button').click();
  await expect(labelInput).toHaveValue(`${test.info().project.name} browser`);

  await signOut(page);
  let callbackRequest: { url: string; body: string; contentType: string } | undefined;
  page.on('request', (request) => {
    if (!request.url().includes('/api/auth/callback/passkey')) return;
    const body = request.postData();
    if (!body) return;
    callbackRequest = {
      url: request.url(),
      body,
      contentType: request.headers()['content-type'] ?? 'application/x-www-form-urlencoded',
    };
  });
  await page.getByRole('button', {
    name: /Sign in with a passkey|Mit Passkey anmelden/i,
  }).click();
  await expect(page).toHaveURL(/\/profiles|\/$/);
  expect(callbackRequest).toBeDefined();
  const replay = await page.request.fetch(callbackRequest!.url, {
    method: 'POST',
    data: callbackRequest!.body,
    headers: { 'content-type': callbackRequest!.contentType },
    maxRedirects: 0,
  });
  expect([302, 303, 400]).toContain(replay.status());
  if (replay.status() < 400) {
    expect(replay.headers().location).toMatch(/error/i);
  }

  await page.goto('/settings#security');
  await unlockPasskeySettings(page, account.password);
  const passkeyRow = page.locator('input[id^="passkey-"]').locator('xpath=ancestor::li');
  await passkeyRow.getByRole('button', {
    name: /Remove passkey|Passkey entfernen/i,
  }).click();
  await passkeyRow.getByRole('button', {
    name: /Confirm passkey removal|Entfernen des Passkeys bestätigen/i,
  }).click();
  await expect(page.locator('input[id^="passkey-"]')).toHaveCount(0);
  await expect.poll(async () => db.authenticator.count({
    where: { userId: user.id },
  })).toBe(0);

  await signOut(page);
  await login(page, account);
  await expect(page).not.toHaveURL(/\/auth\/login/);

  await client.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId });
  await page.goto('/settings#security');
  await unlockPasskeySettings(page, account.password);
  const cancellationAuthenticator = await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: false,
    },
  });
  authenticatorId = cancellationAuthenticator.authenticatorId;
  await page.getByRole('button', { name: /Add a passkey|Passkey hinzufügen/i }).click();
  await page.waitForTimeout(250);
  await client.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId });
  await page.goto('/settings#security');
  await expect.poll(async () => db.authenticator.count({
    where: { userId: user.id },
  })).toBe(0);

  browserFailures.assertNone();
});
