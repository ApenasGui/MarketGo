import { defineConfig } from '@playwright/test';
const port = Number(process.env.MARKETGO_E2E_PORT ?? 4173);
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.mjs',
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    browserName: 'chromium',
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.MARKETGO_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.MARKETGO_CHROMIUM_EXECUTABLE }
      : {},
  },
  webServer: {
    command: 'node scripts/serve-web.mjs',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
