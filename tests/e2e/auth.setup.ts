import { mkdir } from 'node:fs/promises';

import { test as setup } from '@playwright/test';

import { accounts, authStatePaths, login, resetAccountMfa, selectFirstProfile } from './support';

setup.describe.configure({ mode: 'serial' });
setup.beforeAll(async () => {
  await resetAccountMfa(accounts.user.email);
});

for (const role of ['user', 'admin'] as const) {
  setup(`authenticate ${role}`, async ({ page }) => {
    await login(page, accounts[role]);
    await selectFirstProfile(page);
    await mkdir('output/playwright/.auth', { recursive: true });
    await page.context().storageState({ path: authStatePaths[role] });
  });
}
