import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const e2eEnvironmentFile = '.env.e2e.local';

if (existsSync(e2eEnvironmentFile)) {
  process.loadEnvFile(e2eEnvironmentFile);
}

if (process.env.E2E_DATABASE_URL) {
  process.env.POSTGRESQL_URL = process.env.E2E_DATABASE_URL;
  // Mutating journeys are protected by both this marker and a database-name check.
  // The E2E database is the isolated staging target by contract.
  process.env.DEPLOYMENT_ENVIRONMENT = 'staging';
}

// Keep local browser tests isolated from a developer's Docker container or a
// manually started Next server on port 3000. Set PLAYWRIGHT_EXTERNAL_SERVER=true
// only for an intentional run against a separately deployed staging instance.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3001';
const useExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === 'true';
const nodeExecutable = `"${process.execPath}"`;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './output/playwright/test-results',
  reporter: [['list'], ['html', { outputFolder: './output/playwright/report', open: 'never' }]],
  // Browser journeys intentionally share seeded accounts and catalog fixtures.
  // A serial default keeps local runs deterministic on the isolated E2E database.
  fullyParallel: false,
  workers: 1,
  // A first visit compiles a route and its server dependencies in the local
  // Next dev server. Keep the suite deterministic without constraining those
  // one-time builds to Playwright's short default test timeout.
  timeout: 90_000,
  retries: 0,
  // The first navigation to a route compiles it in the local Next dev server.
  // Keep assertions strict while allowing that one-time compile to complete.
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    // Staging deliberately uses a private LAN root CA. Chromium trusts the
    // installed root, but Playwright's Node-based APIRequestContext does not
    // read the operating-system trust store on every platform. Limit this
    // exception to the explicit external staging run; local tests retain
    // normal TLS verification.
    ignoreHTTPSErrors: useExternalServer,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'auth-setup',
      fullyParallel: false,
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'desktop',
      dependencies: ['auth-setup'],
      testIgnore: [/auth\.setup\.ts/, /mfa-journey\.spec\.ts/],
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'mobile',
      dependencies: ['auth-setup'],
      testIgnore: [/auth\.setup\.ts/, /mfa-journey\.spec\.ts/],
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
    {
      name: 'mfa',
      dependencies: ['desktop', 'mobile'],
      testMatch: /mfa-journey\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: `${nodeExecutable} node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3001`,
        env: {
          AUTH_URL: baseURL,
          NEXTAUTH_URL: baseURL,
        },
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
