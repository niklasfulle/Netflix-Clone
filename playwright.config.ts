import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const e2eEnvironmentFile = '.env.e2e.local';

if (existsSync(e2eEnvironmentFile)) {
  process.loadEnvFile(e2eEnvironmentFile);
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const useExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './output/playwright/test-results',
  reporter: [['list'], ['html', { outputFolder: './output/playwright/report', open: 'never' }]],
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL,
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
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'mobile',
      dependencies: ['auth-setup'],
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: 'node node_modules/next/dist/bin/next dev --hostname 127.0.0.1',
        env: {
          AUTH_URL: baseURL,
          NEXTAUTH_URL: baseURL,
        },
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
