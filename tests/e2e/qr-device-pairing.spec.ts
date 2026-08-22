import { expect, test, type APIRequestContext } from '@playwright/test';

import { accounts, authStatePaths, createBrowserFailureMonitor } from './support';

async function warmLocalQrRoutes(request: APIRequestContext) {
  if (process.env.PLAYWRIGHT_EXTERNAL_SERVER === 'true') return;

  // Rejected requests still compile the route modules, but cannot create,
  // approve, consume, or cancel a pairing without valid browser input.
  const responses = await Promise.all([
    request.post('/api/auth/qr', { data: {} }),
    request.post('/api/auth/qr/status', { data: {} }),
    request.post('/api/auth/qr/approve', { data: {} }),
    request.post('/api/auth/qr/exchange', { data: {} }),
    request.post('/api/auth/qr/cancel', { data: {} }),
  ]);

  for (const response of responses) {
    expect(response.status()).toBeLessThan(500);
  }
}

test.describe('QR-assisted device login', () => {
  test('an already signed-in phone approves a separate target-device session', async ({ browser, request }) => {
    await warmLocalQrRoutes(request);

    const targetContext = await browser.newContext();
    const targetPage = await targetContext.newPage();
    const targetFailures = createBrowserFailureMonitor(targetPage);
    const phoneContext = await browser.newContext({ storageState: authStatePaths.user });
    const phonePage = await phoneContext.newPage();
    const pairingResponse = targetPage.waitForResponse((response) => (
      response.url().endsWith('/api/auth/qr')
      && response.request().method() === 'POST'
      && response.status() === 200
    ));

    try {
      // Compile the approval route before creating state on the target page. In
      // development, its first compilation can trigger a full-page HMR reload.
      await phonePage.goto('/auth/qr/approve');
      await phonePage.waitForLoadState('networkidle');
      const phoneFailures = createBrowserFailureMonitor(phonePage);

      await targetPage.goto('/auth/login');
      await targetPage.getByRole('button', { name: /Sign in with QR code|Mit QR-Code anmelden/i }).click();
      const pairing = await (await pairingResponse).json() as { approvalUrl: string };
      expect(pairing.approvalUrl).toMatch(/^https?:\/\//);
      expect(JSON.stringify(pairing)).not.toMatch(/session|email|account/i);
      await expect(targetPage.getByText(/^(Manual code|Manueller Code)$/i)).toBeVisible();

      await phonePage.goto(pairing.approvalUrl);
      await expect(phonePage.getByRole('heading', { name: /Approve device sign-in|Geräteanmeldung freigeben/i }))
        .toBeVisible();
      await phonePage.getByLabel(/Current password|Aktuelles Passwort/i).fill(accounts.user.password);
      await phonePage.getByRole('button', { name: /Approve sign-in|Anmeldung freigeben/i }).click();
      await expect(phonePage.getByText(/approved|freigegeben/i)).toBeVisible();
      phoneFailures.assertNone();

      await expect(targetPage).toHaveURL(/\/profiles/, { timeout: 30_000 });
      targetFailures.assertNone();
    } finally {
      await Promise.all([targetContext.close(), phoneContext.close()]);
    }
  });
});
